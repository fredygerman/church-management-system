import { Injectable } from '@nestjs/common'
import { and, count, eq, isNull, sql } from 'drizzle-orm'
import { db, members, visitors, visitorFollowups, zones } from '@church/db'
import type { LeaderScope } from '../members/members.service'

export interface DashboardStats {
  totalMembers: number
  activeZones: number
  /** Only for roles with view:visitors. See countPendingVisitors. */
  pendingVisitors?: number
}

@Injectable()
export class DashboardService {
  /**
   * Church-scoped counts. Soft-deleted rows (deletedAt set) are excluded.
   * "Active zone" = a non-deleted zone; the zones table has no status column.
   */
  async getStats(churchId: string, scope?: LeaderScope, includeVisitors = false): Promise<DashboardStats> {
    const memberConditions = [eq(members.churchId, churchId), isNull(members.deletedAt)]
    if (scope) memberConditions.push(scope.memberFilter)
    const [memberRow] = await db
      .select({ value: count() })
      .from(members)
      .where(and(...memberConditions))

    const pendingVisitors = includeVisitors ? await this.countPendingVisitors(churchId) : undefined

    // Zone and department leaders: only their own zones are counted (0 for department leaders).
    if (scope) {
      return { totalMembers: Number(memberRow?.value ?? 0), activeZones: scope.zoneCount, pendingVisitors }
    }

    const [zoneRow] = await db
      .select({ value: count() })
      .from(zones)
      .where(and(eq(zones.churchId, churchId), isNull(zones.deletedAt)))

    return {
      totalMembers: Number(memberRow?.value ?? 0),
      activeZones: Number(zoneRow?.value ?? 0),
      pendingVisitors,
    }
  }

  /**
   * Pending visitors: not deleted, not linked to a member (convertedToMemberId empty), and with no
   * non-deleted follow-up marked converted or dropped. Order-independent, so it does not depend on
   * which follow-up is "latest".
   */
  async countPendingVisitors(churchId: string): Promise<number> {
    const [row] = await db
      .select({ value: count() })
      .from(visitors)
      .where(
        and(
          eq(visitors.churchId, churchId),
          isNull(visitors.deletedAt),
          isNull(visitors.convertedToMemberId),
          sql`NOT EXISTS (SELECT 1 FROM ${visitorFollowups} f WHERE f.visitor_id = ${visitors.id} AND f.deleted_at IS NULL AND f.status IN ('converted', 'dropped'))`,
        ),
      )
    return Number(row?.value ?? 0)
  }
}
