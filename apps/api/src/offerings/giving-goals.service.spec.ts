/**
 * Fakes @church/db with a tiny in-memory store, following the exact convention
 * offerings.service.spec.ts already established (drizzle-orm predicates as
 * plain closures, `sql` tagged templates tagged by fragment kind, a
 * select().from().where().groupBy() emulation that sums integers exactly the
 * way Postgres's integer sum() aggregate does). Extended here with the
 * `givingGoals` and `members` tables and `inArray`, since GivingGoalsService's
 * progress and donor-wall queries need both.
 */
jest.mock('drizzle-orm', () => {
  const sqlTag = (strings: TemplateStringsArray, ...values: any[]) => {
    const raw = strings.join('§')
    const kind = raw.includes('sum(') ? 'sum' : 'raw'
    return { __sql: true, __kind: kind, values }
  }

  return {
    eq: (column: string, value: any) => (row: any) => row[column] === value,
    and: (...preds: any[]) => (row: any) => preds.filter(Boolean).every((p) => p(row)),
    isNull: (column: string) => (row: any) => row[column] == null,
    gte: (column: string, value: any) => (row: any) => row[column] >= value,
    lte: (column: string, value: any) => (row: any) => row[column] <= value,
    inArray: (column: string, values: any[]) => (row: any) => values.includes(row[column]),
    sql: sqlTag,
  }
})

jest.mock('@church/db', () => {
  const store: Record<string, any[]> = {
    offerings: [],
    offeringCategories: [],
    givingGoals: [],
    members: [],
  }

  const makeColumnRef = (tableName: string, keys: string[]) => {
    const ref: Record<string, string> = { __table: tableName }
    for (const key of keys) ref[key] = key
    return ref
  }

  const offerings = makeColumnRef('offerings', [
    'id', 'churchId', 'categoryId', 'memberId', 'sessionId', 'amountCents',
    'currency', 'offeringDate', 'note', 'goalId', 'showOnDonorWall',
    'createdAt', 'updatedAt', 'deletedAt',
  ])
  const offeringCategories = makeColumnRef('offeringCategories', [
    'id', 'churchId', 'name', 'description', 'createdAt', 'updatedAt', 'deletedAt',
  ])
  const givingGoals = makeColumnRef('givingGoals', [
    'id', 'churchId', 'name', 'description', 'targetCents', 'currency',
    'startDate', 'endDate', 'isPublic', 'createdAt', 'updatedAt', 'deletedAt',
  ])
  const members = makeColumnRef('members', ['id', 'churchId', 'firstName', 'lastName'])

  const tableArr = (table: any) => store[table.__table]
  const today = () => new Date().toISOString().split('T')[0]
  const makeId = () => Math.random().toString(36).slice(2)

  const findMany = (table: any) => async (opts: any) => {
    let rows = opts?.where ? tableArr(table).filter(opts.where) : tableArr(table).slice()
    if (opts?.limit) rows = rows.slice(0, opts.limit)
    return rows.map((r: any) => ({ ...r }))
  }

  const evalExpr = (expr: any, row: any): any => {
    if (typeof expr === 'string') return row[expr]
    throw new Error(`Cannot evaluate expression of kind ${expr?.__kind} against a single row`)
  }

  const db = {
    insert(table: any) {
      return {
        values(data: any) {
          const defaults =
            table.__table === 'givingGoals'
              ? { isPublic: true }
              : table.__table === 'offerings'
                ? { showOnDonorWall: false }
                : {}
          const row = { id: makeId(), createdAt: today(), updatedAt: today(), deletedAt: null, ...defaults, ...data }
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
      givingGoals: { findMany: findMany(givingGoals) },
      members: { findMany: findMany(members) },
    },
  }

  return {
    db,
    offerings,
    offeringCategories,
    givingGoals,
    members,
    __reset() {
      store.offerings = []
      store.offeringCategories = []
      store.givingGoals = []
      store.members = []
    },
  }
})

import { GivingGoalsService } from './giving-goals.service'
import { OfferingsService } from './offerings.service'

const churchDb = require('@church/db') as { __reset: () => void }

const CHURCH_A = 'church-a'
const CHURCH_B = 'church-b'

describe('GivingGoalsService', () => {
  let service: GivingGoalsService
  let offeringsService: OfferingsService

  beforeEach(() => {
    churchDb.__reset()
    service = new GivingGoalsService()
    offeringsService = new OfferingsService()
  })

  async function makeGoal(overrides: Partial<Parameters<GivingGoalsService['createGoal']>[0]> = {}) {
    return service.createGoal({
      churchId: CHURCH_A,
      name: 'New Bus',
      targetCents: 100_000,
      currency: 'KES',
      startDate: '2026-01-01',
      ...overrides,
    })
  }

  async function makeOffering(overrides: Record<string, any> = {}) {
    const category = await offeringsService.createCategory({ churchId: CHURCH_A, name: 'Tithe' })
    return offeringsService.createOffering({
      churchId: CHURCH_A,
      categoryId: category.id,
      amountCents: 1000,
      currency: 'KES',
      offeringDate: '2026-01-05',
      ...overrides,
    })
  }

  // ---- (a) Exact-sum progress test ----

  it('sums several amountCents integers exactly, with no floating-point drift', async () => {
    const goal = await makeGoal()
    const cents = [1, 2, 5, 10, 25, 33, 99] // includes the classic 0.01 + 0.02 float trap
    for (const amountCents of cents) {
      await makeOffering({ goalId: goal.id, amountCents })
    }

    const result = await service.getGoalWithProgress(CHURCH_A, goal.id)
    expect(result!.raisedCents).toBe(175)
    expect(Number.isInteger(result!.raisedCents)).toBe(true)
  })

  // ---- (b) Zero linked offerings ----

  it('a goal with zero linked offerings returns raisedCents 0, not null or an error', async () => {
    const goal = await makeGoal()
    const result = await service.getGoalWithProgress(CHURCH_A, goal.id)
    expect(result!.raisedCents).toBe(0)
    expect(result!.otherCurrencyTotals).toEqual([])
  })

  // ---- (c) Off-currency offering: excluded from raisedCents, own breakdown row ----

  it('an off-currency offering does not contribute to raisedCents but appears as a separate breakdown row', async () => {
    const goal = await makeGoal({ currency: 'KES' })
    await makeOffering({ goalId: goal.id, amountCents: 5000, currency: 'KES' })
    await makeOffering({ goalId: goal.id, amountCents: 3000, currency: 'USD' })

    const result = await service.getGoalWithProgress(CHURCH_A, goal.id)
    expect(result!.raisedCents).toBe(5000)
    expect(result!.otherCurrencyTotals).toEqual([{ currency: 'USD', totalCents: 3000 }])
    // A blended total would be 8000 - assert it never appears.
    expect(result!.raisedCents).not.toBe(8000)
  })

  // ---- (d) Donor wall ----

  describe('donor wall', () => {
    it('includes a named, opted-in giver; excludes an opted-out giver', async () => {
      const goal = await makeGoal()
      const yes = await makeOffering({ goalId: goal.id, memberId: 'member-yes', showOnDonorWall: true })
      const no = await makeOffering({ goalId: goal.id, memberId: 'member-no', showOnDonorWall: false })
      await churchDb2Members([
        { id: 'member-yes', firstName: 'Grace', lastName: 'Wanjiru' },
        { id: 'member-no', firstName: 'John', lastName: 'Otieno' },
      ])
      expect(yes).toBeDefined()
      expect(no).toBeDefined()

      const publicGoals = await service.getPublicGoalsByChurch(CHURCH_A)
      const names = publicGoals.find((g) => g.id === goal.id)!.donorWallNames
      expect(names).toContain('Grace Wanjiru')
      expect(names).not.toContain('John Otieno')
    })

    it('rejects showOnDonorWall: true on an anonymous (memberId null/absent) offering at write time', async () => {
      const goal = await makeGoal()
      await expect(makeOffering({ goalId: goal.id, showOnDonorWall: true })).rejects.toThrow()
    })

    it('a giver who gave twice to the same goal appears once, not twice', async () => {
      const goal = await makeGoal()
      await churchDb2Members([{ id: 'member-repeat', firstName: 'Grace', lastName: 'Wanjiru' }])
      await makeOffering({ goalId: goal.id, memberId: 'member-repeat', showOnDonorWall: true, amountCents: 1000 })
      await makeOffering({ goalId: goal.id, memberId: 'member-repeat', showOnDonorWall: true, amountCents: 2000 })

      const publicGoals = await service.getPublicGoalsByChurch(CHURCH_A)
      const names = publicGoals.find((g) => g.id === goal.id)!.donorWallNames
      expect(names).toEqual(['Grace Wanjiru'])
    })
  })

  // ---- (e) Public vs staff list filtering ----

  it('the public list returns only isPublic goals; the staff list returns both public and private', async () => {
    const pub = await makeGoal({ name: 'Public Goal', isPublic: true })
    const priv = await makeGoal({ name: 'Private Goal', isPublic: false })

    const publicGoals = await service.getPublicGoalsByChurch(CHURCH_A)
    expect(publicGoals.map((g) => g.id)).toEqual([pub.id])

    const staffGoals = await service.getGoalsByChurch(CHURCH_A)
    expect(staffGoals.map((g) => g.id).sort()).toEqual([pub.id, priv.id].sort())
  })

  // ---- (f) Derived status + targetReached ----

  describe('derived status', () => {
    const iso = (d: Date) => d.toISOString().split('T')[0]
    const daysFromNow = (n: number) => iso(new Date(Date.now() + n * 24 * 60 * 60 * 1000))

    it('derives upcoming when startDate is in the future', async () => {
      const goal = await makeGoal({ startDate: daysFromNow(5) })
      const result = await service.getGoalWithProgress(CHURCH_A, goal.id)
      expect(result!.status).toBe('upcoming')
    })

    it('derives active when endDate is null (open-ended)', async () => {
      const goal = await makeGoal({ startDate: daysFromNow(-5) })
      const result = await service.getGoalWithProgress(CHURCH_A, goal.id)
      expect(result!.status).toBe('active')
    })

    it('derives active when endDate is today or later', async () => {
      const goal = await makeGoal({ startDate: daysFromNow(-5), endDate: daysFromNow(5) })
      const result = await service.getGoalWithProgress(CHURCH_A, goal.id)
      expect(result!.status).toBe('active')
    })

    it('derives ended when endDate is in the past', async () => {
      const goal = await makeGoal({ startDate: daysFromNow(-30), endDate: daysFromNow(-1) })
      const result = await service.getGoalWithProgress(CHURCH_A, goal.id)
      expect(result!.status).toBe('ended')
    })

    it('targetReached is independent of status - an ended, over-funded goal is both', async () => {
      const goal = await makeGoal({
        startDate: daysFromNow(-30),
        endDate: daysFromNow(-1),
        targetCents: 1000,
      })
      await makeOffering({ goalId: goal.id, amountCents: 5000 })
      const result = await service.getGoalWithProgress(CHURCH_A, goal.id)
      expect(result!.status).toBe('ended')
      expect(result!.targetReached).toBe(true)
    })

    it('targetReached is false for an active, under-funded goal', async () => {
      const goal = await makeGoal({ targetCents: 100_000 })
      await makeOffering({ goalId: goal.id, amountCents: 100 })
      const result = await service.getGoalWithProgress(CHURCH_A, goal.id)
      expect(result!.targetReached).toBe(false)
    })
  })

  // ---- (g) Church-scoping ----

  it('church A cannot read, update, or delete church B\'s goals', async () => {
    const goalB = await service.createGoal({
      churchId: CHURCH_B, name: 'Bus', targetCents: 1000, currency: 'KES', startDate: '2026-01-01',
    })

    expect(await service.getGoalByIdInChurch(CHURCH_A, goalB.id)).toBeUndefined()
    expect(await service.getGoalWithProgress(CHURCH_A, goalB.id)).toBeUndefined()

    const updated = await service.updateGoal(CHURCH_A, goalB.id, { name: 'Hijacked' })
    expect(updated).toBeUndefined()
    const stillIntact = await service.getGoalByIdInChurch(CHURCH_B, goalB.id)
    expect(stillIntact!.name).toBe('Bus')

    await service.deleteGoal(CHURCH_A, goalB.id)
    expect(await service.getGoalByIdInChurch(CHURCH_B, goalB.id)).toBeDefined()

    expect(await service.getGoalsByChurch(CHURCH_A)).toHaveLength(0)
  })

  // ---- (h) Link validation ----

  it('rejects linking an offering to a goal from another church', async () => {
    const goalB = await service.createGoal({
      churchId: CHURCH_B, name: 'Bus', targetCents: 1000, currency: 'KES', startDate: '2026-01-01',
    })
    await expect(makeOffering({ goalId: goalB.id })).rejects.toThrow()
  })

  it('rejects linking an offering to a soft-deleted goal', async () => {
    const goal = await makeGoal()
    await service.deleteGoal(CHURCH_A, goal.id)
    await expect(makeOffering({ goalId: goal.id })).rejects.toThrow()
  })

  it('allows creating an offering with goalId omitted, leaving the column null', async () => {
    const offering = await makeOffering()
    expect(offering.goalId ?? null).toBeNull()
  })
})

// Test-only helper: seed the fake `members` table directly, since
// GivingGoalsService's donor-wall query resolves names via a lookup rather
// than owning member creation itself.
async function churchDb2Members(rows: { id: string; firstName: string; lastName: string }[]) {
  const churchDb = require('@church/db') as { db: any }
  for (const row of rows) {
    await churchDb.db.insert({ __table: 'members' }).values({ churchId: CHURCH_A, ...row }).returning()
  }
}
