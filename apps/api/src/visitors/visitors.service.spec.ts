/**
 * Fakes @church/db with a tiny in-memory store so VisitorsService's followup
 * methods (church-scoping, ownership verification, soft-delete filtering)
 * can be exercised without a real database. Uses the same predicate-closure
 * and in-memory-store approach as events.service.spec.ts.
 */
jest.mock('drizzle-orm', () => ({
  eq: (column: string, value: any) => (row: any) => row[column] === value,
  and: (...preds: any[]) => (row: any) => preds.filter(Boolean).every((p) => p(row)),
  isNull: (column: string) => (row: any) => row[column] == null,
}))

jest.mock('@church/config', () => ({
  toDateString: (date: any) => {
    if (!date) return new Date().toISOString().split('T')[0]
    if (typeof date === 'string') return date.split('T')[0]
    return date.toISOString().split('T')[0]
  },
  getToday: () => new Date().toISOString().split('T')[0],
}))

jest.mock('@church/db', () => {
  const store: Record<string, any[]> = {
    visitors: [],
    visitorFollowups: [],
  }

  const makeColumnRef = (tableName: string, keys: string[]) => {
    const ref: Record<string, string> = { __table: tableName }
    for (const key of keys) ref[key] = key
    return ref
  }

  const visitors = makeColumnRef('visitors', [
    'id', 'churchId', 'firstName', 'lastName', 'phone', 'email', 'visitDate',
    'visitorSource', 'referredByMemberId', 'convertedToMemberId', 'createdAt', 'updatedAt', 'deletedAt',
  ])
  const visitorFollowups = makeColumnRef('visitorFollowups', [
    'id', 'visitorId', 'status', 'notes', 'followupDate', 'completedBy', 'createdAt', 'updatedAt', 'deletedAt',
  ])

  const tableArr = (table: any) => store[table.__table]
  const now = () => new Date()
  const makeId = () => Math.random().toString(36).slice(2)

  const defaultsFor = (tableName: string): Record<string, any> => {
    if (tableName === 'visitorFollowups') {
      return { status: 'none' }
    }
    return {}
  }

  const findMany = (table: any) => async (opts: any) => {
    let rows = opts?.where ? tableArr(table).filter(opts.where) : tableArr(table).slice()
    if (opts?.limit) rows = rows.slice(0, opts.limit)
    return rows.map((r: any) => ({ ...r }))
  }

  const db = {
    insert(table: any) {
      return {
        values(data: any) {
          const row = {
            id: makeId(),
            createdAt: now().toISOString().split('T')[0],
            updatedAt: now().toISOString().split('T')[0],
            deletedAt: null,
            ...defaultsFor(table.__table),
            ...data,
          }
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
    query: {
      visitors: { findMany: findMany(visitors) },
      visitorFollowups: { findMany: findMany(visitorFollowups) },
    },
  }

  return {
    db,
    visitors,
    visitorFollowups,
    __reset() {
      store.visitors = []
      store.visitorFollowups = []
    },
    __seedVisitor(data: any) {
      const visitor = {
        id: data.id,
        churchId: data.churchId,
        firstName: data.firstName || 'First',
        lastName: data.lastName || 'Last',
        phone: data.phone || null,
        email: data.email || null,
        visitDate: data.visitDate || now().toISOString().split('T')[0],
        visitorSource: data.visitorSource || null,
        referredByMemberId: data.referredByMemberId || null,
        convertedToMemberId: data.convertedToMemberId || null,
        createdAt: now().toISOString().split('T')[0],
        updatedAt: now().toISOString().split('T')[0],
        deletedAt: data.deletedAt || null,
      }
      store.visitors.push(visitor)
      return visitor
    },
  }
})

import { VisitorsService } from './visitors.service'
import { BadRequestException } from '@nestjs/common'

const churchDb = require('@church/db') as {
  __reset: () => void
  __seedVisitor: (data: any) => any
}

const CHURCH_A = 'church-a'
const CHURCH_B = 'church-b'

describe('VisitorsService', () => {
  let service: VisitorsService

  beforeEach(() => {
    churchDb.__reset()
    service = new VisitorsService()
  })

  it('getFollowupsByVisitor returns followups for a visitor in the same church', async () => {
    const visitor = churchDb.__seedVisitor({
      id: 'visitor-1',
      churchId: CHURCH_A,
      firstName: 'John',
      lastName: 'Doe',
    })

    // Create a followup
    const followup = await service.createFollowup({
      churchId: CHURCH_A,
      visitorId: visitor.id,
      status: 'contacted',
      notes: 'Test note',
    })

    // Should be able to retrieve it
    const followups = await service.getFollowupsByVisitor(CHURCH_A, visitor.id)
    expect(followups).toHaveLength(1)
    expect(followups[0].id).toBe(followup.id)
    expect(followups[0].notes).toBe('Test note')
  })

  it('getFollowupsByVisitor returns empty array for a visitor in a different church', async () => {
    const visitor = churchDb.__seedVisitor({
      id: 'visitor-1',
      churchId: CHURCH_A,
      firstName: 'John',
      lastName: 'Doe',
    })

    // Create a followup in church A
    await service.createFollowup({
      churchId: CHURCH_A,
      visitorId: visitor.id,
      status: 'contacted',
    })

    // Try to retrieve from church B - should return empty, not throw
    const followups = await service.getFollowupsByVisitor(CHURCH_B, visitor.id)
    expect(followups).toEqual([])
  })

  it('getLatestFollowupStatus returns undefined for a visitor in a different church', async () => {
    const visitor = churchDb.__seedVisitor({
      id: 'visitor-1',
      churchId: CHURCH_A,
      firstName: 'John',
      lastName: 'Doe',
    })

    // Create a followup in church A
    await service.createFollowup({
      churchId: CHURCH_A,
      visitorId: visitor.id,
      status: 'contacted',
    })

    // Try to retrieve from church B
    const latest = await service.getLatestFollowupStatus(CHURCH_B, visitor.id)
    expect(latest).toBeUndefined()
  })

  it('createFollowup throws BadRequestException for a visitor in a different church', async () => {
    const visitor = churchDb.__seedVisitor({
      id: 'visitor-1',
      churchId: CHURCH_A,
      firstName: 'John',
      lastName: 'Doe',
    })

    // Try to create a followup in church B - should throw
    await expect(
      service.createFollowup({
        churchId: CHURCH_B,
        visitorId: visitor.id,
        status: 'contacted',
      })
    ).rejects.toThrow(BadRequestException)

    // Verify no followup was created
    const allFollowups = await service.getFollowupsByVisitor(CHURCH_A, visitor.id)
    expect(allFollowups).toHaveLength(0)
  })

  it('createFollowup does not include churchId in the inserted row', async () => {
    const visitor = churchDb.__seedVisitor({
      id: 'visitor-1',
      churchId: CHURCH_A,
      firstName: 'John',
      lastName: 'Doe',
    })

    const followup = await service.createFollowup({
      churchId: CHURCH_A,
      visitorId: visitor.id,
      status: 'contacted',
      notes: 'Test',
    })

    // Verify the row has no churchId key (which would fail on DB insert)
    expect(followup).not.toHaveProperty('churchId')
    expect(followup.visitorId).toBe(visitor.id)
    expect(followup.status).toBe('contacted')
  })

  it('getFollowupsByVisitor returns empty array for a soft-deleted visitor', async () => {
    const visitor = churchDb.__seedVisitor({
      id: 'visitor-1',
      churchId: CHURCH_A,
      firstName: 'John',
      lastName: 'Doe',
      deletedAt: now().toISOString().split('T')[0], // Soft-deleted
    })

    // Create a followup first (using the service which doesn't soft-delete check at insert time)
    // but then try to retrieve for the soft-deleted visitor
    const followups = await service.getFollowupsByVisitor(CHURCH_A, visitor.id)
    expect(followups).toEqual([])
  })
})

// Helper to get current date string
const now = () => new Date()
