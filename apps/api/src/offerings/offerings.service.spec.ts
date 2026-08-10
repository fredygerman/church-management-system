/**
 * Fakes @church/db with a tiny in-memory store so OfferingsService's real query
 * logic (church-scoping, soft-delete filtering, self-service filtering, and the
 * SQL-level `sum(amount_cents)` report aggregation) can be exercised without a
 * real database.
 *
 * drizzle-orm's `eq`/`and`/`isNull`/`gte`/`lte` are mocked as plain predicate
 * closures operating on our in-memory rows (column refs are just field-name
 * strings, mirroring departments.service.spec.ts's convention).
 *
 * `sql` is mocked as a tagged-template that tags its output by the SQL
 * fragment it represents (`sum`, `date_trunc`, `to_char`) so the fake
 * `db.select(...).groupBy(...)` chain below can actually group rows and sum
 * `amountCents` with plain integer addition - the same exactness guarantee
 * Postgres's integer `sum()` aggregate gives in production, just evaluated
 * here instead of inside a real database.
 */
jest.mock('drizzle-orm', () => {
  const sqlTag = (strings: TemplateStringsArray, ...values: any[]) => {
    const raw = strings.join('§')
    let kind: 'sum' | 'date_trunc' | 'to_char' | 'raw' = 'raw'
    if (raw.includes('sum(')) kind = 'sum'
    else if (raw.includes('date_trunc(')) kind = 'date_trunc'
    else if (raw.includes('to_char(')) kind = 'to_char'
    return { __sql: true, __kind: kind, values }
  }

  return {
    eq: (column: string, value: any) => (row: any) => row[column] === value,
    and: (...preds: any[]) => (row: any) => preds.filter(Boolean).every((p) => p(row)),
    isNull: (column: string) => (row: any) => row[column] == null,
    gte: (column: string, value: any) => (row: any) => row[column] >= value,
    lte: (column: string, value: any) => (row: any) => row[column] <= value,
    sql: sqlTag,
  }
})

jest.mock('@church/db', () => {
  const store: Record<string, any[]> = {
    offerings: [],
    offeringCategories: [],
  }

  const makeColumnRef = (tableName: string, keys: string[]) => {
    const ref: Record<string, string> = { __table: tableName }
    for (const key of keys) ref[key] = key
    return ref
  }

  const offerings = makeColumnRef('offerings', [
    'id', 'churchId', 'categoryId', 'memberId', 'sessionId', 'amountCents',
    'currency', 'offeringDate', 'note', 'createdAt', 'updatedAt', 'deletedAt',
  ])
  const offeringCategories = makeColumnRef('offeringCategories', [
    'id', 'churchId', 'name', 'description', 'createdAt', 'updatedAt', 'deletedAt',
  ])

  const tableArr = (table: any) => store[table.__table]
  const today = () => new Date().toISOString().split('T')[0]
  const makeId = () => Math.random().toString(36).slice(2)

  const findMany = (table: any) => async (opts: any) => {
    let rows = opts?.where ? tableArr(table).filter(opts.where) : tableArr(table).slice()
    if (opts?.limit) rows = rows.slice(0, opts.limit)
    return rows.map((r: any) => ({ ...r }))
  }

  // Resolve a SELECT projection value or a GROUP BY key against a single row.
  // Plain string => column ref, direct field read. Object => tagged `sql`
  // fragment (date_trunc/to_char); 'sum' fragments are handled separately at
  // the group level since they aggregate across every row in the bucket.
  const dateBucket = (period: string, dateStr: string) => {
    if (period === 'year') return `${dateStr.slice(0, 4)}-01-01`
    if (period === 'month') return `${dateStr.slice(0, 7)}-01`
    // week: Monday of the ISO week containing dateStr
    const d = new Date(`${dateStr}T00:00:00Z`)
    const day = d.getUTCDay()
    const diff = (day === 0 ? -6 : 1) - day
    d.setUTCDate(d.getUTCDate() + diff)
    return d.toISOString().slice(0, 10)
  }

  const evalExpr = (expr: any, row: any): any => {
    if (typeof expr === 'string') return row[expr]
    if (expr?.__kind === 'date_trunc') {
      const [period, column] = expr.values
      return dateBucket(period, row[column])
    }
    if (expr?.__kind === 'to_char') {
      return evalExpr(expr.values[0], row)
    }
    throw new Error(`Cannot evaluate expression of kind ${expr?.__kind} against a single row`)
  }

  const db = {
    insert(table: any) {
      return {
        values(data: any) {
          const row = { id: makeId(), createdAt: today(), updatedAt: today(), deletedAt: null, ...data }
          return {
            async returning() {
              tableArr(table).push(row)
              return [row]
            },
          }
        },
      }
    },
    update(table: any) {
      return {
        set(patch: any) {
          return {
            where(pred: any) {
              const matched = tableArr(table).filter(pred)
              matched.forEach((r: any) => Object.assign(r, patch))
              const result: any = Promise.resolve(matched)
              result.returning = async () => matched
              return result
            },
          }
        },
      }
    },
    // Minimal group-by/aggregate emulation of a Postgres `SELECT ... GROUP BY`
    // for the reports/summary query. Filters rows, buckets them by the
    // requested group-by expressions, and sums `amountCents` with plain
    // integer addition per bucket - exact by construction, same as a real
    // Postgres integer `sum()`.
    select(projection: Record<string, any>) {
      let fromTable: any
      let wherePred: any = () => true
      let groupExprs: any[] = []

      const api: any = {
        from(table: any) {
          fromTable = table
          return api
        },
        where(pred: any) {
          wherePred = pred
          return api
        },
        groupBy(...exprs: any[]) {
          groupExprs = exprs
          return api
        },
        orderBy() {
          return api
        },
        then(resolve: any, reject: any) {
          try {
            const rows = tableArr(fromTable).filter(wherePred)

            const buckets = new Map<string, any[]>()
            for (const row of rows) {
              const key = groupExprs.map((expr) => evalExpr(expr, row)).join('|')
              if (!buckets.has(key)) buckets.set(key, [])
              buckets.get(key)!.push(row)
            }

            const result = Array.from(buckets.values()).map((groupRows) => {
              const out: Record<string, any> = {}
              for (const [outKey, expr] of Object.entries(projection)) {
                if (expr?.__kind === 'sum') {
                  const column = expr.values[0]
                  out[outKey] = String(groupRows.reduce((sum, r) => sum + r[column], 0))
                } else {
                  out[outKey] = evalExpr(expr, groupRows[0])
                }
              }
              return out
            })

            resolve(result)
          } catch (err) {
            reject(err)
          }
          return Promise.resolve()
        },
      }

      return api
    },
    query: {
      offerings: { findMany: findMany(offerings) },
      offeringCategories: { findMany: findMany(offeringCategories) },
    },
  }

  return {
    db,
    offerings,
    offeringCategories,
    __reset() {
      store.offerings = []
      store.offeringCategories = []
    },
  }
})

import { OfferingsService } from './offerings.service'

const churchDb = require('@church/db') as { __reset: () => void }

const CHURCH_A = 'church-a'
const CHURCH_B = 'church-b'

describe('OfferingsService', () => {
  let service: OfferingsService

  beforeEach(() => {
    churchDb.__reset()
    service = new OfferingsService()
  })

  // ---- Basic CRUD sanity (categories + offerings) ----

  it('creates and lists offering categories, excluding soft-deleted ones', async () => {
    const tithe = await service.createCategory({ churchId: CHURCH_A, name: 'Tithe' })
    await service.createCategory({ churchId: CHURCH_A, name: 'Missions' })
    await service.deleteCategory(CHURCH_A, tithe.id)

    const list = await service.getCategoriesByChurch(CHURCH_A)
    expect(list).toHaveLength(1)
    expect(list[0].name).toBe('Missions')
  })

  it('creates, updates and soft-deletes an offering', async () => {
    const category = await service.createCategory({ churchId: CHURCH_A, name: 'Tithe' })
    const offering = await service.createOffering({
      churchId: CHURCH_A,
      categoryId: category.id,
      amountCents: 5000,
      currency: 'KES',
      offeringDate: '2026-01-05',
    })

    const updated = await service.updateOffering(CHURCH_A, offering.id, { amountCents: 6000 })
    expect(updated.amountCents).toBe(6000)

    await service.deleteOffering(CHURCH_A, offering.id)
    const found = await service.getOfferingByIdInChurch(CHURCH_A, offering.id)
    expect(found).toBeUndefined()
  })

  // ---- (c) Church-scoping ----

  it('scopes offerings and categories to their church (church A invisible to church B)', async () => {
    const category = await service.createCategory({ churchId: CHURCH_A, name: 'Tithe' })
    const offering = await service.createOffering({
      churchId: CHURCH_A,
      categoryId: category.id,
      amountCents: 1000,
      currency: 'KES',
      offeringDate: '2026-01-05',
    })

    expect(await service.getCategoriesByChurch(CHURCH_B)).toHaveLength(0)
    expect(await service.getCategoryByIdInChurch(CHURCH_B, category.id)).toBeUndefined()
    expect(await service.getOfferingsByChurch(CHURCH_B)).toHaveLength(0)
    expect(await service.getOfferingByIdInChurch(CHURCH_B, offering.id)).toBeUndefined()

    // Church A can see its own data
    expect(await service.getCategoryByIdInChurch(CHURCH_A, category.id)).toBeDefined()
    expect(await service.getOfferingByIdInChurch(CHURCH_A, offering.id)).toBeDefined()

    const summaryB = await service.getSummaryReport(CHURCH_B, { groupBy: 'category' })
    expect(summaryB).toEqual([])
  })

  // ---- (d) Self-service /offerings/me equivalent ----

  it('getMyOfferings returns only the target member\'s own rows, excluding null-memberId (anonymous) and other members\' rows', async () => {
    const category = await service.createCategory({ churchId: CHURCH_A, name: 'Tithe' })
    const memberA = 'member-a'
    const memberB = 'member-b'

    const own = await service.createOffering({
      churchId: CHURCH_A, categoryId: category.id, memberId: memberA,
      amountCents: 1500, currency: 'KES', offeringDate: '2026-01-05',
    })
    await service.createOffering({
      churchId: CHURCH_A, categoryId: category.id, memberId: memberB,
      amountCents: 2500, currency: 'KES', offeringDate: '2026-01-06',
    })
    await service.createOffering({
      // Anonymous basket total - memberId is null
      churchId: CHURCH_A, categoryId: category.id,
      amountCents: 9999, currency: 'KES', offeringDate: '2026-01-07',
    })

    const mine = await service.getMyOfferings(CHURCH_A, memberA)
    expect(mine).toHaveLength(1)
    expect(mine[0].id).toBe(own.id)
    expect(mine.every((row) => row.memberId === memberA)).toBe(true)
  })

  it('a member with no named offerings gets an empty list, not an error', async () => {
    const mine = await service.getMyOfferings(CHURCH_A, 'nobody')
    expect(mine).toEqual([])
  })

  // ---- (a) Exact-sum test (no floating-point drift) ----

  it('report sums are exact integer totals for cent amounts that are classic float traps (e.g. 1 + 2 cents)', async () => {
    const category = await service.createCategory({ churchId: CHURCH_A, name: 'Tithe' })
    // 0.01 + 0.02 famously produces 0.030000000000000002 in IEEE754 float math.
    // Using integer cents and a SQL-style integer sum must produce exactly 3.
    const cents = [1, 2, 5, 10, 25, 33, 99]
    for (const amountCents of cents) {
      await service.createOffering({
        churchId: CHURCH_A, categoryId: category.id,
        amountCents, currency: 'KES', offeringDate: '2026-01-05',
      })
    }

    const report = await service.getSummaryReport(CHURCH_A, { groupBy: 'category' })
    expect(report).toHaveLength(1)
    expect(report[0].totalCents).toBe(175)
    expect(Number.isInteger(report[0].totalCents)).toBe(true)
  })

  // ---- (b) Multi-currency: never blend currencies ----

  it('groups report totals by dimension AND currency - never sums across currencies', async () => {
    const category = await service.createCategory({ churchId: CHURCH_A, name: 'Tithe' })

    await service.createOffering({
      churchId: CHURCH_A, categoryId: category.id,
      amountCents: 1000, currency: 'KES', offeringDate: '2026-01-05',
    })
    await service.createOffering({
      churchId: CHURCH_A, categoryId: category.id,
      amountCents: 2000, currency: 'KES', offeringDate: '2026-01-06',
    })
    await service.createOffering({
      churchId: CHURCH_A, categoryId: category.id,
      amountCents: 500, currency: 'USD', offeringDate: '2026-01-07',
    })

    const report = await service.getSummaryReport(CHURCH_A, { groupBy: 'category' })
    expect(report).toHaveLength(2)

    const byCurrency = new Map(report.map((row) => [row.currency, row.totalCents]))
    expect(byCurrency.get('KES')).toBe(3000)
    expect(byCurrency.get('USD')).toBe(500)

    // A blended (wrong) total would be 3500 - assert it never appears anywhere.
    expect(report.some((row) => row.totalCents === 3500)).toBe(false)
  })

  it('groups period reports by period bucket AND currency - never sums across currencies', async () => {
    const category = await service.createCategory({ churchId: CHURCH_A, name: 'Tithe' })

    // Two offerings in the same month, different currencies.
    await service.createOffering({
      churchId: CHURCH_A, categoryId: category.id,
      amountCents: 1200, currency: 'KES', offeringDate: '2026-01-05',
    })
    await service.createOffering({
      churchId: CHURCH_A, categoryId: category.id,
      amountCents: 300, currency: 'USD', offeringDate: '2026-01-20',
    })
    // A different month, same currency as the first - must be its own bucket.
    await service.createOffering({
      churchId: CHURCH_A, categoryId: category.id,
      amountCents: 700, currency: 'KES', offeringDate: '2026-02-10',
    })

    const report = await service.getSummaryReport(CHURCH_A, { groupBy: 'period', period: 'month' })
    expect(report).toHaveLength(3)

    const jan = report.filter((row) => row.groupKey === '2026-01-01')
    const feb = report.filter((row) => row.groupKey === '2026-02-01')
    expect(jan).toHaveLength(2)
    expect(feb).toHaveLength(1)

    const janByCurrency = new Map(jan.map((row) => [row.currency, row.totalCents]))
    expect(janByCurrency.get('KES')).toBe(1200)
    expect(janByCurrency.get('USD')).toBe(300)
    expect(feb[0].totalCents).toBe(700)
  })
})
