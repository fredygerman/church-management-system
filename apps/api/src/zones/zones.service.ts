import { Injectable } from '@nestjs/common'
import { eq, and, isNull } from 'drizzle-orm'
import { db } from '@church/db'
import { zones, NewZone, Zone } from '@church/db'

export type CreateZoneInput = {
  churchId: string
  name: string
  description?: string
  leaderId?: string
  meetingDay?: string
}

@Injectable()
export class ZonesService {
  /**
   * Create a new zone (Zone)
   */
  async createZone(data: CreateZoneInput): Promise<Zone> {
    const [zone] = await db.insert(zones).values(data).returning()
    return zone
  }

  /**
   * Get all zones in a church
   */
  async getZonesByChurch(churchId: string): Promise<Zone[]> {
    return db.query.zones.findMany({
      where: and(
        eq(zones.churchId, churchId),
        isNull(zones.deletedAt),
      ),
    })
  }

  /**
   * Get a single zone by ID
   */
  async getZoneById(zoneId: string): Promise<Zone | undefined> {
    const [zone] = await db.query.zones.findMany({
      where: eq(zones.id, zoneId),
    })
    return zone
  }

  /**
   * Update zone details
   */
  async updateZone(zoneId: string, data: Partial<CreateZoneInput>): Promise<Zone> {
    const [updatedZone] = await db
      .update(zones)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(zones.id, zoneId))
      .returning()
    return updatedZone
  }

  /**
   * Soft delete zone
   */
  async deleteZone(zoneId: string): Promise<void> {
    await db
      .update(zones)
      .set({ deletedAt: new Date() })
      .where(eq(zones.id, zoneId))
  }

  /**
   * Assign a leader to a zone
   */
  async assignLeader(zoneId: string, leaderId: string): Promise<Zone> {
    const [updatedZone] = await db
      .update(zones)
      .set({ leaderId, updatedAt: new Date() })
      .where(eq(zones.id, zoneId))
      .returning()
    return updatedZone
  }

  /**
   * Get zones by meeting day
   */
  async getZonesByMeetingDay(churchId: string, meetingDay: string): Promise<Zone[]> {
    return db.query.zones.findMany({
      where: and(
        eq(zones.churchId, churchId),
        eq(zones.meetingDay, meetingDay),
        isNull(zones.deletedAt),
      ),
    })
  }
}
