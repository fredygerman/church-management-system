import { Injectable } from '@nestjs/common'
import { eq, and, isNull, or, ilike } from 'drizzle-orm'
import { db } from '@church/db'
import { members, memberZones, zones, type Member, type MemberZone } from '@church/db'

export type CreateMemberInput = {
  churchId: string
  firstName: string
  lastName: string
  phone?: string
  dateOfBirth: Date
  gender: 'male' | 'female' | 'others'
  occupation?: string
  dateOfSalvation?: Date
  baptismStatus?: 'none' | 'maji' | 'roho_mtakatifu' | 'both'
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed'
  familyId?: string
  notes?: string
}

@Injectable()
export class MembersService {
  /**
   * Create a new member
   */
  async createMember(data: CreateMemberInput): Promise<Member> {
    const [member] = await db.insert(members).values({
      ...data,
      baptismStatus: data.baptismStatus || 'none',
    }).returning()
    return member
  }

  /**
   * Get all members in a church
   */
  async getMembersByChurch(churchId: string): Promise<Member[]> {
    return db.query.members.findMany({
      where: and(
        eq(members.churchId, churchId),
        isNull(members.deletedAt),
      ),
    })
  }

  /**
   * Get a single member by ID
   */
  async getMemberById(churchId: string, memberId: string): Promise<Member | undefined> {
    const [member] = await db.query.members.findMany({
      where: and(eq(members.id, memberId), eq(members.churchId, churchId), isNull(members.deletedAt)),
    })
    return member
  }

  /**
   * Update member details
   */
  async updateMember(churchId: string, memberId: string, data: Partial<CreateMemberInput>): Promise<Member> {
    const [updatedMember] = await db
      .update(members)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(members.id, memberId), eq(members.churchId, churchId), isNull(members.deletedAt)))
      .returning()
    return updatedMember
  }

  /**
   * Soft delete member
   */
  async deleteMember(churchId: string, memberId: string): Promise<void> {
    await db
      .update(members)
      .set({ deletedAt: new Date() })
      .where(and(eq(members.id, memberId), eq(members.churchId, churchId), isNull(members.deletedAt)))
  }

  /**
   * Search members by name or phone
   */
  async searchMembers(churchId: string, query: string): Promise<Member[]> {
    const searchQuery = `%${query}%`
    
    return db.query.members.findMany({
      where: and(
        eq(members.churchId, churchId),
        isNull(members.deletedAt),
        or(
          ilike(members.firstName, searchQuery),
          ilike(members.lastName, searchQuery),
          ilike(members.phone, searchQuery),
        ),
      ),
    })
  }

  /**
   * Get members by zone (via memberZones junction table)
   */
  async getMembersByZone(churchId: string, zoneId: string): Promise<Member[]> {
    const memberRecords = await db.query.memberZones.findMany({
      where: eq(memberZones.zoneId, zoneId),
      with: { member: true, zone: true },
    })
    return memberRecords
      .filter((record) => record.zone?.churchId === churchId)
      .map((record) => record.member)
      .filter((member) => member.churchId === churchId && !member.deletedAt)
  }

  /**
   * Assign member to zone
   */
  async assignToZone(churchId: string, memberId: string, zoneId: string, isLeader: boolean = false): Promise<MemberZone> {
    const [member] = await db.query.members.findMany({
      where: and(eq(members.id, memberId), eq(members.churchId, churchId), isNull(members.deletedAt)),
      limit: 1,
    })
    const [zone] = await db.query.zones.findMany({
      where: and(eq(zones.id, zoneId), eq(zones.churchId, churchId), isNull(zones.deletedAt)),
      limit: 1,
    })
    if (!member || !zone) {
      throw new Error('Member or zone not found in church context')
    }

    const [assignment] = await db
      .insert(memberZones)
      .values({ memberId, zoneId, isLeader })
      .returning()
    return assignment
  }

  /**
   * Remove member from zone
   */
  async removeFromZone(memberId: string, zoneId: string): Promise<void> {
    await db
      .delete(memberZones)
      .where(and(
        eq(memberZones.memberId, memberId),
        eq(memberZones.zoneId, zoneId),
      ))
  }

  /**
   * Get zones for a member
   */
  async getMemberZones(churchId: string, memberId: string): Promise<MemberZone[]> {
    return db.query.memberZones.findMany({
      where: eq(memberZones.memberId, memberId),
      with: { zone: true },
    }).then((rows) => rows.filter((row) => row.zone?.churchId === churchId))
  }

  /**
   * Get members by family
   */
  async getMembersByFamily(churchId: string, familyId: string): Promise<Member[]> {
    return db.query.members.findMany({
      where: and(
        eq(members.churchId, churchId),
        eq(members.familyId, familyId),
        isNull(members.deletedAt),
      ),
    })
  }

  /**
   * Link member to family
   */
  async linkToFamily(churchId: string, memberId: string, familyId: string): Promise<Member> {
    const [updatedMember] = await db
      .update(members)
      .set({ familyId, updatedAt: new Date() })
      .where(and(eq(members.id, memberId), eq(members.churchId, churchId), isNull(members.deletedAt)))
      .returning()
    return updatedMember
  }
}

