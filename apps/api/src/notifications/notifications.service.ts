import { Injectable, NotFoundException } from '@nestjs/common'
import { and, eq, inArray, isNull } from 'drizzle-orm'
import { db, inboxNotifications, userChurchMemberships } from '@church/db'

export interface CreateInboxNotificationInput {
  userId: string
  churchId?: string | null
  type: string
  templateKey: string
  templateData?: Record<string, string | number | boolean | null>
  targetType?: string | null
  targetParams?: Record<string, string | number | boolean | null> | null
  sourceKey?: string
}

export interface NotificationListQuery {
  limit?: number
  cursor?: string
  unreadOnly?: boolean
}

@Injectable()
export class NotificationsService {
  async list(userId: string, input: NotificationListQuery = {}) {
    const memberships = await db.query.userChurchMemberships.findMany({
      where: and(
        eq(userChurchMemberships.userId, userId),
        eq(userChurchMemberships.status, 'active'),
        isNull(userChurchMemberships.deletedAt),
      ),
    })
    const accessibleChurchIds = new Set(memberships.map((membership: any) => membership.churchId))
    const rows = await db.query.inboxNotifications.findMany({
      where: and(
        eq(inboxNotifications.userId, userId),
        input.unreadOnly ? isNull(inboxNotifications.readAt) : undefined,
      ),
    })
    const visible = rows
      .filter((row: any) => row.churchId == null || accessibleChurchIds.has(row.churchId))
      .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
    const unreadCount = visible.filter((row: any) => row.readAt == null).length
    const offset = input.cursor ? Number.parseInt(input.cursor, 10) : 0
    const limit = Math.min(Math.max(input.limit ?? 20, 1), 100)
    const page = visible.slice(Number.isInteger(offset) && offset >= 0 ? offset : 0, (offset || 0) + limit)
    const nextOffset = (offset || 0) + limit

    return {
      items: page.map((row: any) => this.toResponse(row)),
      unreadCount,
      nextCursor: nextOffset < visible.length ? String(nextOffset) : null,
    }
  }

  async markRead(userId: string, id: string) {
    const visible = await this.getVisibleNotification(userId, id)
    const [updated] = await db
      .update(inboxNotifications)
      .set({ readAt: visible.readAt ?? new Date() })
      .where(and(eq(inboxNotifications.id, id), eq(inboxNotifications.userId, userId)))
      .returning()
    return this.toResponse(updated ?? visible)
  }

  async markAllRead(userId: string) {
    const result = await this.list(userId, { limit: 100 })
    const unreadIds = result.items.filter((item: any) => item.readAt == null).map((item: any) => item.id)
    if (unreadIds.length > 0) {
      await db
        .update(inboxNotifications)
        .set({ readAt: new Date() })
        .where(and(eq(inboxNotifications.userId, userId), inArray(inboxNotifications.id, unreadIds)))
    }
    return { markedCount: unreadIds.length }
  }

  async create(input: CreateInboxNotificationInput) {
    const values = {
      userId: input.userId,
      churchId: input.churchId ?? null,
      type: input.type,
      templateKey: input.templateKey,
      templateData: input.templateData,
      targetType: input.targetType ?? null,
      targetParams: input.targetParams ?? null,
      sourceKey: input.sourceKey,
    }
    const query = db.insert(inboxNotifications).values(values)
    const [created] = input.sourceKey
      ? await query.onConflictDoNothing({ target: inboxNotifications.sourceKey }).returning()
      : await query.returning()
    return created ? this.toResponse(created) : null
  }

  private async getVisibleNotification(userId: string, id: string) {
    const result = await this.list(userId, { limit: 100 })
    const item = result.items.find((candidate: any) => candidate.id === id)
    if (!item) throw new NotFoundException('Notification not found')

    const [row] = await db.query.inboxNotifications.findMany({
      where: and(eq(inboxNotifications.id, id), eq(inboxNotifications.userId, userId)),
    })
    if (!row) throw new NotFoundException('Notification not found')
    return row
  }

  private toResponse(row: any) {
    return {
      id: row.id,
      churchId: row.churchId,
      type: row.type,
      templateKey: row.templateKey,
      templateData: row.templateData ?? {},
      target:
        row.targetType == null
          ? null
          : { type: row.targetType, params: row.targetParams ?? {} },
      createdAt: row.createdAt,
      readAt: row.readAt,
    }
  }
}
