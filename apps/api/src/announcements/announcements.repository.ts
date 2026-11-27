import { Injectable } from '@nestjs/common'
import { and, asc, desc, eq, gt, inArray, isNull, lte, or, sql } from 'drizzle-orm'
import {
  announcements,
  announcementSettings,
  db,
  memberZones,
  members,
  userChurchMemberships,
  type Announcement,
} from '@church/db'
import type {
  AnnouncementAudience,
  AnnouncementBodyFormat,
  AnnouncementPatch,
  AnnouncementRepository,
  AnnouncementRow,
  AnnouncementStatus,
  NewAnnouncementRow,
  PageQuery,
  ViewerProfile,
} from './announcements.types'

/** Drizzle implementation. Every query is scoped by church_id; the service passes the guard-validated tenant. */
@Injectable()
export class DrizzleAnnouncementRepository implements AnnouncementRepository {
  async insert(row: NewAnnouncementRow): Promise<AnnouncementRow> {
    const [inserted] = await db
      .insert(announcements)
      .values({
        churchId: row.churchId,
        title: row.title,
        summary: row.summary,
        bodyFormat: row.bodyFormat,
        body: row.body,
        channels: row.channels,
        audience: row.audience,
        smsBody: row.smsBody,
        status: row.status,
        createdBy: row.createdBy,
        expiresAt: row.expiresAt,
        scheduledAt: row.scheduledAt,
      })
      .returning()
    return toRow(inserted)
  }

  async findById(churchId: string, id: string): Promise<AnnouncementRow | null> {
    const [row] = await db
      .select()
      .from(announcements)
      .where(and(eq(announcements.churchId, churchId), eq(announcements.id, id), isNull(announcements.deletedAt)))
      .limit(1)
    return row ? toRow(row) : null
  }

  async updateWhenStatus(
    churchId: string,
    id: string,
    expected: AnnouncementStatus[],
    patch: AnnouncementPatch,
  ): Promise<AnnouncementRow | null> {
    const [row] = await db
      .update(announcements)
      .set({ ...patch, updatedAt: new Date() })
      .where(
        and(
          eq(announcements.churchId, churchId),
          eq(announcements.id, id),
          inArray(announcements.status, expected),
          isNull(announcements.deletedAt),
        ),
      )
      .returning()
    return row ? toRow(row) : null
  }

  async page(query: PageQuery): Promise<AnnouncementRow[]> {
    const sortAt = sql`coalesce(${announcements.publishedAt}, ${announcements.createdAt})`
    const conditions = [eq(announcements.churchId, query.churchId), isNull(announcements.deletedAt)]

    if (query.memberVisibleOnly) {
      conditions.push(eq(announcements.status, 'published'))
      conditions.push(or(isNull(announcements.expiresAt), gt(announcements.expiresAt, query.now))!)
    } else if (query.status) {
      conditions.push(eq(announcements.status, query.status))
    }

    // Keyset on (sort time, id). The cursor is resolved inside the same church, so a foreign id yields no rows.
    if (query.afterId) {
      conditions.push(
        sql`(${sortAt}, ${announcements.id}) < (
          select coalesce(a.published_at, a.created_at), a.id
          from announcements a
          where a.id = ${query.afterId} and a.church_id = ${query.churchId}
        )`,
      )
    }

    const rows = await db
      .select()
      .from(announcements)
      .where(and(...conditions))
      .orderBy(sql`${sortAt} desc`, desc(announcements.id))
      .limit(query.limit)
    return rows.map(toRow)
  }

  async findDueScheduled(now: Date, limit: number): Promise<AnnouncementRow[]> {
    const rows = await db
      .select()
      .from(announcements)
      .where(
        and(
          eq(announcements.status, 'scheduled'),
          lte(announcements.scheduledAt, now),
          isNull(announcements.deletedAt),
        ),
      )
      .orderBy(asc(announcements.scheduledAt), asc(announcements.id))
      .limit(limit)
    return rows.map(toRow)
  }

  async findViewerProfile(churchId: string, userId: string): Promise<ViewerProfile | null> {
    const [membership] = await db
      .select({
        memberId: userChurchMemberships.memberId,
        assignedZoneId: userChurchMemberships.assignedZoneId,
      })
      .from(userChurchMemberships)
      .where(
        and(
          eq(userChurchMemberships.userId, userId),
          eq(userChurchMemberships.churchId, churchId),
          eq(userChurchMemberships.status, 'active'),
          isNull(userChurchMemberships.deletedAt),
        ),
      )
      .limit(1)
    if (!membership) return null

    let gender: ViewerProfile['gender'] = null
    let maritalStatus: ViewerProfile['maritalStatus'] = null
    const zoneIds = new Set<string>()
    if (membership.assignedZoneId) zoneIds.add(membership.assignedZoneId)

    if (membership.memberId) {
      const [member] = await db
        .select({ gender: members.gender, maritalStatus: members.maritalStatus })
        .from(members)
        .where(and(eq(members.id, membership.memberId), eq(members.churchId, churchId), isNull(members.deletedAt)))
        .limit(1)
      gender = member?.gender ?? null
      maritalStatus = member?.maritalStatus ?? null

      const zoneRows = await db
        .select({ zoneId: memberZones.zoneId })
        .from(memberZones)
        .where(
          and(
            eq(memberZones.memberId, membership.memberId),
            eq(memberZones.churchId, churchId),
            isNull(memberZones.deletedAt),
          ),
        )
      for (const zone of zoneRows) zoneIds.add(zone.zoneId)
    }

    return {
      userId,
      memberId: membership.memberId ?? null,
      gender,
      maritalStatus,
      zoneIds: [...zoneIds],
    }
  }

  async getRequireApproval(churchId: string): Promise<boolean> {
    const [settings] = await db
      .select({ requireApproval: announcementSettings.requireApproval })
      .from(announcementSettings)
      .where(eq(announcementSettings.churchId, churchId))
      .limit(1)
    return settings?.requireApproval ?? false
  }
}

function toRow(row: Announcement): AnnouncementRow {
  return {
    id: row.id,
    churchId: row.churchId,
    title: row.title,
    summary: row.summary,
    bodyFormat: row.bodyFormat as AnnouncementBodyFormat,
    body: row.body,
    channels: row.channels,
    audience: row.audience as AnnouncementAudience,
    smsBody: row.smsBody,
    status: row.status,
    publishIdempotencyKey: row.publishIdempotencyKey,
    createdBy: row.createdBy,
    approvedBy: row.approvedBy,
    approvedAt: row.approvedAt,
    scheduledAt: row.scheduledAt,
    publishedAt: row.publishedAt,
    cancelledAt: row.cancelledAt,
    expiresAt: row.expiresAt,
    deletedAt: row.deletedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}
