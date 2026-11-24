import { Injectable } from '@nestjs/common'
import { and, count, eq, isNull } from 'drizzle-orm'
import { db, members, zones } from '@church/db'

export interface DashboardStats {
  totalMembers: number
  activeZones: number
}

@Injectable()
export class DashboardService {
  /**
   * Church-scoped counts. Soft-deleted rows (deletedAt set) are excluded.
   * "Active zone" = a non-deleted zone; the zones table has no status column.
   */
  async getStats(churchId: string): Promise<DashboardStats> {
    const [memberRow] = await db
      .select({ value: count() })
      .from(members)
      .where(and(eq(members.churchId, churchId), isNull(members.deletedAt)))

    const [zoneRow] = await db
      .select({ value: count() })
      .from(zones)
      .where(and(eq(zones.churchId, churchId), isNull(zones.deletedAt)))

    return {
      totalMembers: Number(memberRow?.value ?? 0),
      activeZones: Number(zoneRow?.value ?? 0),
    }
  }
}
