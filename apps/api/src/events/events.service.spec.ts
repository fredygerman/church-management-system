/**
 * Fakes @church/db with a tiny in-memory store so EventsService's real query
 * logic (church-scoping, the read/write visibility asymmetry, soft-delete
 * filtering, and RSVP upsert-on-conflict) can be exercised without a real
 * database. Extends the mocking approach from offerings.service.spec.ts
 * (predicate closures for drizzle-orm combinators) and departments.service.spec.ts
 * (insert().onConflictDoUpdate() upsert emulation), adding `or` - not needed
 * by either of those specs, but required here for `visibleToChurch`.
 */
jest.mock('drizzle-orm', () => ({
  eq: (column: string, value: any) => (row: any) => row[column] === value,
  and: (...preds: any[]) => (row: any) => preds.filter(Boolean).every((p) => p(row)),
  or: (...preds: any[]) => (row: any) => preds.filter(Boolean).some((p) => p(row)),
  isNull: (column: string) => (row: any) => row[column] == null,
  gte: (column: string, value: any) => (row: any) => row[column] >= value,
  lte: (column: string, value: any) => (row: any) => row[column] <= value,
  inArray: (column: string, values: any[]) => (row: any) => values.includes(row[column]),
}))

jest.mock('@church/db', () => {
  const store: Record<string, any[]> = {
    events: [],
    eventRsvps: [],
  }

  const makeColumnRef = (tableName: string, keys: string[]) => {
    const ref: Record<string, string> = { __table: tableName }
    for (const key of keys) ref[key] = key
    return ref
  }

  const events = makeColumnRef('events', [
    'id', 'churchId', 'title', 'description', 'location', 'startsAt', 'endsAt',
    'scope', 'status', 'headcount', 'createdAt', 'updatedAt', 'deletedAt',
  ])
  const eventRsvps = makeColumnRef('eventRsvps', [
    'id', 'eventId', 'memberId', 'churchId', 'status', 'attended', 'createdAt', 'updatedAt',
  ])

  const tableArr = (table: any) => store[table.__table]
  const now = () => new Date()
  const makeId = () => Math.random().toString(36).slice(2)

  // Mirrors the real tables' column defaults (events.scope='church',
  // events.status='draft', eventRsvps.attended=false) since drizzle applies
  // these at the DB layer, which this in-memory store stands in for.
  const defaultsFor = (tableName: string): Record<string, any> => {
    if (tableName === 'events') {
      return { scope: 'church', status: 'draft', headcount: null, endsAt: null, description: null, location: null }
    }
    if (tableName === 'eventRsvps') {
      return { attended: false }
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
            createdAt: now(),
            updatedAt: now(),
            deletedAt: null,
            ...defaultsFor(table.__table),
            ...data,
          }
          return {
            async returning() {
              tableArr(table).push(row)
              return [row]
            },
            onConflictDoUpdate({ target, set }: any) {
              return {
                async returning() {
                  const arr = tableArr(table)
                  const existing = arr.find((r: any) => target.every((col: string) => r[col] === data[col]))
                  if (existing) {
                    Object.assign(existing, set)
                    return [existing]
                  }
                  arr.push(row)
                  return [row]
                },
              }
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
      events: { findMany: findMany(events) },
      eventRsvps: { findMany: findMany(eventRsvps) },
    },
  }

  return {
    db,
    events,
    eventRsvps,
    __reset() {
      store.events = []
      store.eventRsvps = []
    },
  }
})

import { EventsService } from './events.service'

const churchDb = require('@church/db') as { __reset: () => void }

const CHURCH_A = 'church-a'
const CHURCH_B = 'church-b'

describe('EventsService', () => {
  let service: EventsService

  beforeEach(() => {
    churchDb.__reset()
    service = new EventsService()
  })

  // ---- (a) CRUD + soft-delete + church scoping ----

  it('creates, updates and soft-deletes an event', async () => {
    const event = await service.createEvent({
      churchId: CHURCH_A,
      title: 'Youth Seminar',
      startsAt: '2026-03-01T18:00:00',
    })
    expect(event.scope).toBe('church')
    expect(event.status).toBe('draft')

    const updated = await service.updateEvent(CHURCH_A, event.id, { title: 'Youth Seminar (Updated)' })
    expect(updated?.title).toBe('Youth Seminar (Updated)')

    await service.deleteEvent(CHURCH_A, event.id)
    const found = await service.getEventByIdInChurch(CHURCH_A, event.id)
    expect(found).toBeUndefined()
  })

  it('church A\'s scope="church" event is invisible to church B', async () => {
    const event = await service.createEvent({
      churchId: CHURCH_A,
      title: 'Branch Social',
      startsAt: '2026-03-01T18:00:00',
      status: 'published',
    })

    expect(await service.getEventByIdInChurch(CHURCH_B, event.id)).toBeUndefined()
    expect(await service.getEventsByChurch(CHURCH_B)).toHaveLength(0)

    // Owning church can see its own event
    expect(await service.getEventByIdInChurch(CHURCH_A, event.id)).toBeDefined()
  })

  // ---- (b) Network visibility - the highest-risk logic in this feature ----

  it('church B sees church A\'s published network event', async () => {
    const event = await service.createEvent({
      churchId: CHURCH_A,
      title: 'Camp Meeting',
      startsAt: '2026-04-01T09:00:00',
      scope: 'network',
      status: 'published',
    })

    const visible = await service.getEventByIdInChurch(CHURCH_B, event.id)
    expect(visible).toBeDefined()
    expect(await service.getEventsByChurch(CHURCH_B)).toHaveLength(1)
  })

  it('church B does NOT see church A\'s draft network event', async () => {
    const event = await service.createEvent({
      churchId: CHURCH_A,
      title: 'Camp Meeting (planning)',
      startsAt: '2026-04-01T09:00:00',
      scope: 'network',
      status: 'draft',
    })

    expect(await service.getEventByIdInChurch(CHURCH_B, event.id)).toBeUndefined()
    expect(await service.getEventsByChurch(CHURCH_B)).toHaveLength(0)
  })

  it('church B CANNOT update or delete church A\'s published network event, even though it can read it - the core read/write asymmetry', async () => {
    const event = await service.createEvent({
      churchId: CHURCH_A,
      title: 'Camp Meeting',
      startsAt: '2026-04-01T09:00:00',
      scope: 'network',
      status: 'published',
    })

    // Church B can read it (widened visibility)...
    expect(await service.getEventByIdInChurch(CHURCH_B, event.id)).toBeDefined()

    // ...but cannot write to it (write scoping never widens).
    const updateResult = await service.updateEvent(CHURCH_B, event.id, { title: 'Hijacked' })
    expect(updateResult).toBeUndefined()

    await service.deleteEvent(CHURCH_B, event.id)

    // The row is untouched: still there, still owned by A, title unchanged, not deleted.
    const stillThere = await service.getEventByIdInChurch(CHURCH_A, event.id)
    expect(stillThere).toBeDefined()
    expect(stillThere?.title).toBe('Camp Meeting')
    expect(stillThere?.deletedAt).toBeNull()

    // Also confirm church A itself can still perform the write it owns.
    const ownerUpdate = await service.updateEvent(CHURCH_A, event.id, { title: 'Camp Meeting (updated)' })
    expect(ownerUpdate?.title).toBe('Camp Meeting (updated)')
  })

  it('staffRsvp and setAttendance also reject a non-owning church on a visible network event', async () => {
    const event = await service.createEvent({
      churchId: CHURCH_A,
      title: 'Camp Meeting',
      startsAt: '2026-04-01T09:00:00',
      scope: 'network',
      status: 'published',
    })

    await expect(
      service.staffRsvp(CHURCH_B, event.id, { memberId: 'walkup-1', status: 'going' }),
    ).rejects.toThrow()

    await expect(
      service.setAttendance(CHURCH_B, event.id, { headcount: 500 }),
    ).rejects.toThrow()
  })

  // ---- (c) Member-portal visibility: drafts invisible even to the owning church's own members ----

  it('a draft event is invisible even to members of its own owning church when the published-only filter is applied', async () => {
    const draft = await service.createEvent({
      churchId: CHURCH_A,
      title: 'Draft Retreat',
      startsAt: '2026-05-01T09:00:00',
      status: 'draft',
    })
    const published = await service.createEvent({
      churchId: CHURCH_A,
      title: 'Published Retreat',
      startsAt: '2026-05-08T09:00:00',
      status: 'published',
    })

    // Staff view (no publishedOnly) sees both.
    expect(await service.getEventsByChurch(CHURCH_A)).toHaveLength(2)

    // Member-portal view (publishedOnly=true) sees only the published one.
    const portalList = await service.getEventsByChurch(CHURCH_A, {}, true)
    expect(portalList.map((e) => e.id)).toEqual([published.id])

    expect(await service.getEventByIdInChurch(CHURCH_A, draft.id, true)).toBeUndefined()
    expect(await service.getEventByIdInChurch(CHURCH_A, published.id, true)).toBeDefined()
  })

  // ---- (d) RSVP behavior ----

  it('rsvp() upsert is idempotent on (eventId, memberId): going -> declined updates in place', async () => {
    const event = await service.createEvent({
      churchId: CHURCH_A,
      title: 'Seminar',
      startsAt: '2026-06-01T09:00:00',
      status: 'published',
    })

    await service.rsvp(CHURCH_A, 'member-1', event.id, 'going')
    await service.rsvp(CHURCH_A, 'member-1', event.id, 'declined')

    const mine = await service.getMyRsvps(CHURCH_A, 'member-1')
    expect(mine).toHaveLength(1)
    expect(mine[0].status).toBe('declined')
  })

  it('rejects RSVP to a draft or cancelled event', async () => {
    const draft = await service.createEvent({
      churchId: CHURCH_A,
      title: 'Draft Event',
      startsAt: '2026-06-01T09:00:00',
      status: 'draft',
    })
    const cancelled = await service.createEvent({
      churchId: CHURCH_A,
      title: 'Cancelled Event',
      startsAt: '2026-06-01T09:00:00',
      status: 'cancelled',
    })

    await expect(service.rsvp(CHURCH_A, 'member-1', draft.id, 'going')).rejects.toThrow()
    await expect(service.rsvp(CHURCH_A, 'member-1', cancelled.id, 'going')).rejects.toThrow()
  })

  it('event_rsvps.churchId records the RSVP-er\'s own church, not the event owner\'s church (network event)', async () => {
    const event = await service.createEvent({
      churchId: CHURCH_A,
      title: 'Camp Meeting',
      startsAt: '2026-06-01T09:00:00',
      scope: 'network',
      status: 'published',
    })

    const rsvp = await service.rsvp(CHURCH_B, 'member-from-b', event.id, 'going')
    expect(rsvp.churchId).toBe(CHURCH_B)
    expect(rsvp.churchId).not.toBe(event.churchId)
  })

  // ---- (e) Self-service /events/me equivalent ----

  it('getMyRsvps returns only the resolved member\'s own RSVPs', async () => {
    const event = await service.createEvent({
      churchId: CHURCH_A,
      title: 'Seminar',
      startsAt: '2026-06-01T09:00:00',
      status: 'published',
    })

    await service.rsvp(CHURCH_A, 'member-1', event.id, 'going')
    await service.rsvp(CHURCH_A, 'member-2', event.id, 'maybe')

    const mine = await service.getMyRsvps(CHURCH_A, 'member-1')
    expect(mine).toHaveLength(1)
    expect(mine[0].memberId).toBe('member-1')
    expect(mine[0].event?.id).toBe(event.id)
  })

  // ---- (f) Attendance ----

  it('marks attended=true only on the listed member ids, and creates a going/attended row for a walk-up with no prior RSVP', async () => {
    const event = await service.createEvent({
      churchId: CHURCH_A,
      title: 'Seminar',
      startsAt: '2026-06-01T09:00:00',
      status: 'published',
    })

    await service.rsvp(CHURCH_A, 'member-1', event.id, 'going')
    await service.rsvp(CHURCH_A, 'member-2', event.id, 'going')

    await service.setAttendance(CHURCH_A, event.id, { attendedMemberIds: ['member-1', 'walkup-1'] })

    const roster = await service.getRoster(CHURCH_A, event.id)
    const byMember = new Map(roster!.rows.map((r) => [r.memberId, r]))

    expect(byMember.get('member-1')?.attended).toBe(true)
    expect(byMember.get('member-2')?.attended).toBe(false)

    const walkup = byMember.get('walkup-1')
    expect(walkup).toBeDefined()
    expect(walkup?.status).toBe('going')
    expect(walkup?.attended).toBe(true)
  })

  it('writes headcount onto the event, owning church only', async () => {
    const event = await service.createEvent({
      churchId: CHURCH_A,
      title: 'Big Rally',
      startsAt: '2026-06-01T09:00:00',
      status: 'published',
    })

    const updated = await service.setAttendance(CHURCH_A, event.id, { headcount: 250 })
    expect(updated.headcount).toBe(250)
  })

  // ---- Roster with per-branch breakdown for network events ----

  it('getRoster groups counts by church for network-scope events (per-branch breakdown)', async () => {
    const event = await service.createEvent({
      churchId: CHURCH_A,
      title: 'Camp Meeting',
      startsAt: '2026-06-01T09:00:00',
      scope: 'network',
      status: 'published',
    })

    await service.rsvp(CHURCH_A, 'member-a1', event.id, 'going')
    await service.rsvp(CHURCH_B, 'member-b1', event.id, 'going')
    await service.rsvp(CHURCH_B, 'member-b2', event.id, 'maybe')

    const roster = await service.getRoster(CHURCH_A, event.id)
    expect(roster?.countsByStatus).toEqual({ going: 2, maybe: 1 })
    expect(roster?.countsByChurch).toEqual({
      [CHURCH_A]: { going: 1 },
      [CHURCH_B]: { going: 1, maybe: 1 },
    })
  })
})
