import { Injectable } from '@nestjs/common'
import { eq, and, isNull } from 'drizzle-orm'
import { db } from '@church/db'
import { zones, memberZones, members, NewZone, Zone } from '@church/db'

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

  async getZoneByIdInChurch(churchId: string, zoneId: string): Promise<Zone | undefined> {
    const [zone] = await db.query.zones.findMany({
      where: and(eq(zones.id, zoneId), eq(zones.churchId, churchId), isNull(zones.deletedAt)),
      limit: 1,
    })
    return zone
  }

  /**
   * Update zone details
   */
  async updateZone(churchId: string, zoneId: string, data: Partial<CreateZoneInput>): Promise<Zone> {
    const [updatedZone] = await db
      .update(zones)
      .set({ ...data, updatedAt: new Date().toISOString().split('T')[0] as any })
      .where(and(eq(zones.id, zoneId), eq(zones.churchId, churchId), isNull(zones.deletedAt)))
      .returning()
    return updatedZone
  }

  /**
   * Soft delete zone
   */
  async deleteZone(churchId: string, zoneId: string): Promise<void> {
    await db
      .update(zones)
      .set({ deletedAt: new Date().toISOString().split('T')[0] as any })
      .where(and(eq(zones.id, zoneId), eq(zones.churchId, churchId), isNull(zones.deletedAt)))
  }

  /**
   * Assign a leader to a zone
   */
  async assignLeader(churchId: string, zoneId: string, leaderId: string): Promise<Zone> {
    const [updatedZone] = await db
      .update(zones)
      .set({ leaderId, updatedAt: new Date().toISOString().split('T')[0] as any })
      .where(and(eq(zones.id, zoneId), eq(zones.churchId, churchId), isNull(zones.deletedAt)))
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

  /**
   * Get members in a zone
   */
  async getZoneMembers(churchId: string, zoneId: string): Promise<any[]> {
    // Use a join query instead of relational query to avoid relation issues
    const result = await db
      .select({
        id: members.id,
        firstName: members.firstName,
        lastName: members.lastName,
        phone: members.phone,
        dateOfBirth: members.dateOfBirth,
        gender: members.gender,
        occupation: members.occupation,
        dateOfSalvation: members.dateOfSalvation,
        baptismStatus: members.baptismStatus,
        maritalStatus: members.maritalStatus,
        familyId: members.familyId,
        notes: members.notes,
        churchId: members.churchId,
        createdAt: members.createdAt,
        updatedAt: members.updatedAt,
        deletedAt: members.deletedAt,
        isLeader: memberZones.isLeader,
      })
      .from(memberZones)
      .innerJoin(zones, eq(memberZones.zoneId, zones.id))
      .innerJoin(members, eq(memberZones.memberId, members.id))
      .where(and(
        eq(memberZones.zoneId, zoneId),
        eq(zones.churchId, churchId),
        isNull(members.deletedAt)
      ))
    
    return result
  }

  /**
   * Assign a member to a zone
   */
  async assignMemberToZone(churchId: string, zoneId: string, memberId: string, isLeader: boolean = false): Promise<any> {
    const [zone] = await db.query.zones.findMany({
      where: and(eq(zones.id, zoneId), eq(zones.churchId, churchId), isNull(zones.deletedAt)),
      limit: 1,
    })
    const [member] = await db.query.members.findMany({
      where: and(eq(members.id, memberId), eq(members.churchId, churchId), isNull(members.deletedAt)),
      limit: 1,
    })
    if (!zone || !member) {
      throw new Error('Zone or member not found in church context')
    }

    // Use insert with onConflict to handle upsert
    const [assignment] = await db
      .insert(memberZones)
      .values({ churchId, zoneId, memberId, isLeader })
      .onConflictDoUpdate({
        target: [memberZones.memberId, memberZones.zoneId],
        set: { churchId, isLeader },
      })
      .returning()
    
    // If making this member a leader, update the zone's leaderId
    if (isLeader) {
      await db
        .update(zones)
        .set({ leaderId: memberId, updatedAt: new Date().toISOString().split('T')[0] as any })
        .where(and(eq(zones.id, zoneId), eq(zones.churchId, churchId), isNull(zones.deletedAt)))
    }
    
    return assignment
  }

  /**
   * Remove a member from a zone
   */
  async removeMemberFromZone(churchId: string, zoneId: string, memberId: string): Promise<void> {
    const [zone] = await db.query.zones.findMany({
      where: and(eq(zones.id, zoneId), eq(zones.churchId, churchId), isNull(zones.deletedAt)),
      limit: 1,
    })
    if (!zone) {
      throw new Error('Zone not found in church context')
    }

    await db
      .delete(memberZones)
      .where(and(
        eq(memberZones.zoneId, zoneId),
        eq(memberZones.memberId, memberId),
      ))
  }

  /**
   * Get zone statistics
   */
  async getZoneStats(churchId: string, zoneId: string): Promise<any> {
    const members = await this.getZoneMembers(churchId, zoneId)
    
    const totalMembers = members.length
    const leaders = members.filter(m => m.isLeader).length
    const regularMembers = totalMembers - leaders

    return {
      totalMembers,
      leaders,
      regularMembers,
    }
  }
}
