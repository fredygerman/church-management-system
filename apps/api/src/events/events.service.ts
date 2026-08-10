import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { eq, and, or, isNull, gte, lte, inArray } from 'drizzle-orm'
import { db, events, eventRsvps, members, type Event, type EventRsvp } from '@church/db'

export type EventScope = 'church' | 'network'
export type EventStatus = 'draft' | 'published' | 'cancelled'
export type RsvpStatus = 'going' | 'maybe' | 'declined'

export type CreateEventInput = {
  churchId: string
  title: string
  startsAt: string | Date
  description?: string
  location?: string
  endsAt?: string | Date
  scope?: EventScope
  status?: EventStatus
}

export type UpdateEventInput = Partial<CreateEventInput>

export type EventFilters = {
  from?: string
  to?: string
  status?: EventStatus
  scope?: EventScope
}

export type StaffRsvpInput = {
  memberId: string
  status: RsvpStatus
}

export type AttendanceInput = {
  attendedMemberIds?: string[]
  headcount?: number
}

const now = () => new Date()

@Injectable()
export class EventsService {
  /**
   * The single place a read predicate widens past the active church: rows the
   * church owns, OR published network events from any church. Used for every
   * read. Never used for a write - see updateEvent/deleteEvent/staffRsvp/
   * setAttendance, which all AND in a plain eq(events.churchId, churchId).
   */
  private visibleToChurch(churchId: string) {
    return or(
      eq(events.churchId, churchId),
      and(eq(events.scope, 'network'), eq(events.status, 'published')),
    )
  }

  private async getOwnedEvent(churchId: string, eventId: string): Promise<Event | undefined> {
    const [event] = await db.query.events.findMany({
      where: and(eq(events.id, eventId), eq(events.churchId, churchId), isNull(events.deletedAt)),
      limit: 1,
    })
    return event
  }

  // ---- Events ----

  async createEvent(data: CreateEventInput): Promise<Event> {
    const [event] = await db.insert(events).values(data as any).returning()
    return event
  }

  /**
   * List events visible to this church. `publishedOnly` additionally requires
   * status = 'published', so drafts never leak into member-portal reads even
   * for members of the owning church.
   */
  async getEventsByChurch(
    churchId: string,
    filters: EventFilters = {},
    publishedOnly = false,
    limit?: number,
    offset?: number,
  ): Promise<Event[]> {
    const effectiveLimit = limit ?? 200
    const effectiveOffset = offset ?? 0
    return db.query.events.findMany({
      where: and(
        this.visibleToChurch(churchId),
        isNull(events.deletedAt),
        publishedOnly ? eq(events.status, 'published') : undefined,
        filters.status ? eq(events.status, filters.status) : undefined,
        filters.scope ? eq(events.scope, filters.scope) : undefined,
        filters.from ? gte(events.startsAt, filters.from as any) : undefined,
        filters.to ? lte(events.startsAt, filters.to as any) : undefined,
      ),
      limit: effectiveLimit,
      offset: effectiveOffset,
    })
  }

  async getEventByIdInChurch(
    churchId: string,
    eventId: string,
    publishedOnly = false,
  ): Promise<Event | undefined> {
    const [event] = await db.query.events.findMany({
      where: and(
        eq(events.id, eventId),
        this.visibleToChurch(churchId),
        isNull(events.deletedAt),
        publishedOnly ? eq(events.status, 'published') : undefined,
      ),
      limit: 1,
    })
    return event
  }

  /** Owning church only - never the widened visibility predicate. */
  async updateEvent(churchId: string, eventId: string, data: UpdateEventInput): Promise<Event | undefined> {
    const [updated] = await db
      .update(events)
      .set({ ...data, updatedAt: now() as any })
      .where(and(eq(events.id, eventId), eq(events.churchId, churchId), isNull(events.deletedAt)))
      .returning()
    return updated
  }

  /** Owning church only - soft delete. */
  async deleteEvent(churchId: string, eventId: string): Promise<void> {
    await db
      .update(events)
      .set({ deletedAt: now() as any })
      .where(and(eq(events.id, eventId), eq(events.churchId, churchId), isNull(events.deletedAt)))
  }

  // ---- RSVPs ----

  /**
   * RSVP roster + counts. A read, so it uses the widened visibility predicate
   * (a branch admin can view - never edit - the roster of a network event it
   * doesn't own). Counts are grouped by churchId too when the event is
   * network-scoped, giving the per-branch breakdown.
   */
  async getRoster(churchId: string, eventId: string): Promise<{
    event: Event
    rows: EventRsvp[]
    countsByStatus: Record<string, number>
    countsByChurch?: Record<string, Record<string, number>>
  } | undefined> {
    const event = await this.getEventByIdInChurch(churchId, eventId)
    if (!event) return undefined

    const rows = await db.query.eventRsvps.findMany({ where: eq(eventRsvps.eventId, eventId) })

    const countsByStatus: Record<string, number> = {}
    for (const row of rows) {
      countsByStatus[row.status] = (countsByStatus[row.status] ?? 0) + 1
    }

    let countsByChurch: Record<string, Record<string, number>> | undefined
    if (event.scope === 'network') {
      countsByChurch = {}
      for (const row of rows) {
        countsByChurch[row.churchId] ??= {}
        countsByChurch[row.churchId][row.status] = (countsByChurch[row.churchId][row.status] ?? 0) + 1
      }
    }

    return { event, rows, countsByStatus, countsByChurch }
  }

  /**
   * Staff RSVP on a member's behalf, or a walk-up registration. Owning church
   * only - never widens. Upserts on (eventId, memberId).
   */
  async staffRsvp(churchId: string, eventId: string, input: StaffRsvpInput): Promise<EventRsvp> {
    const event = await this.getOwnedEvent(churchId, eventId)
    if (!event) throw new NotFoundException(`Event with ID ${eventId} not found`)

    const [rsvp] = await db
      .insert(eventRsvps)
      .values({ eventId, memberId: input.memberId, churchId, status: input.status })
      .onConflictDoUpdate({
        target: [eventRsvps.eventId, eventRsvps.memberId],
        set: { status: input.status, updatedAt: now() as any },
      })
      .returning()
    return rsvp
  }

  /**
   * Self-service RSVP. Verifies the event is visible to the caller's church
   * AND published before upserting, then writes churchId from the RSVP-er's
   * own current church context - NOT the event's owning church. This is what
   * makes a network event's per-branch RSVP breakdown a plain groupBy, and it
   * is the one place a write "widens" the read it depends on without
   * widening the row it touches: the row created always belongs to the
   * caller's own church.
   */
  async rsvp(churchId: string, memberId: string, eventId: string, status: RsvpStatus): Promise<EventRsvp> {
    const event = await this.getEventByIdInChurch(churchId, eventId)
    if (!event || event.status !== 'published') {
      throw new BadRequestException('This event is not open for RSVPs')
    }

    const [rsvp] = await db
      .insert(eventRsvps)
      .values({ eventId, memberId, churchId, status })
      .onConflictDoUpdate({
        target: [eventRsvps.eventId, eventRsvps.memberId],
        set: { status, updatedAt: now() as any },
      })
      .returning()
    return rsvp
  }

  /**
   * Self-service: the caller's own RSVPs only, joined to their event. Filters
   * strictly on the resolved memberId - the same safe construction as
   * getMyOfferings.
   */
  async getMyRsvps(churchId: string, memberId: string): Promise<(EventRsvp & { event: Event | null })[]> {
    const rows = await db.query.eventRsvps.findMany({
      where: and(eq(eventRsvps.churchId, churchId), eq(eventRsvps.memberId, memberId)),
    })
    const eventIds: string[] = Array.from(new Set(rows.map((r) => r.eventId)))
    const relatedEvents = eventIds.length
      ? await db.query.events.findMany({ where: inArray(events.id, eventIds) })
      : []
    const eventById = new Map(relatedEvents.map((e) => [e.id, e]))
    return rows.map((row) => ({ ...row, event: eventById.get(row.eventId) ?? null }))
  }

  /**
   * Owning church only. Sets attended=true on the listed RSVP rows (creating
   * a going+attended row for any walk-up id with no prior RSVP), and/or
   * writes events.headcount.
   */
  async setAttendance(churchId: string, eventId: string, input: AttendanceInput): Promise<Event> {
    const event = await this.getOwnedEvent(churchId, eventId)
    if (!event) throw new NotFoundException(`Event with ID ${eventId} not found`)

    if (input.attendedMemberIds && input.attendedMemberIds.length > 0) {
      const churchMembers = await db.query.members.findMany({
        where: and(
          eq(members.churchId, churchId),
          inArray(members.id, input.attendedMemberIds),
          isNull(members.deletedAt),
        ),
      })
      if (churchMembers.length !== new Set(input.attendedMemberIds).size) {
        throw new BadRequestException('One or more members do not belong to this church')
      }

      const existing = await db.query.eventRsvps.findMany({
        where: and(eq(eventRsvps.eventId, eventId), inArray(eventRsvps.memberId, input.attendedMemberIds)),
      })
      const existingMemberIds = new Set(existing.map((r) => r.memberId))

      await db
        .update(eventRsvps)
        .set({ attended: true, updatedAt: now() as any })
        .where(and(eq(eventRsvps.eventId, eventId), inArray(eventRsvps.memberId, input.attendedMemberIds)))

      for (const memberId of input.attendedMemberIds) {
        if (existingMemberIds.has(memberId)) continue
        await db
          .insert(eventRsvps)
          .values({ eventId, memberId, churchId, status: 'going', attended: true })
          .onConflictDoUpdate({
            target: [eventRsvps.eventId, eventRsvps.memberId],
            set: { attended: true, updatedAt: now() as any },
          })
          .returning()
      }
    }

    if (input.headcount != null) {
      const [updated] = await db
        .update(events)
        .set({ headcount: input.headcount, updatedAt: now() as any })
        .where(and(eq(events.id, eventId), eq(events.churchId, churchId)))
        .returning()
      return updated
    }

    return (await this.getOwnedEvent(churchId, eventId)) ?? event
  }
}
