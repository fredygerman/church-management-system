import { Injectable } from '@nestjs/common'
import { eq, and, isNull } from 'drizzle-orm'
import { db } from '@church/db'
import { members, memberZones, type NewMember, type Member, type MemberZone } from '@church/db'

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
  async getMemberById(memberId: string): Promise<Member | undefined> {
    const [member] = await db.query.members.findMany({
      where: eq(members.id, memberId),
    })
    return member
  }

  /**
   * Update member details
   */
  async updateMember(memberId: string, data: Partial<CreateMemberInput>): Promise<Member> {
    const [updatedMember] = await db
      .update(members)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(members.id, memberId))
      .returning()
    return updatedMember
  }

  /**
   * Soft delete member
   */
  async deleteMember(memberId: string): Promise<void> {
    await db
      .update(members)
      .set({ deletedAt: new Date() })
      .where(eq(members.id, memberId))
  }

  /**
   * Search members by name or phone
   */
  async searchMembers(churchId: string, query: string): Promise<Member[]> {
    return db.query.members.findMany({
      where: and(
        eq(members.churchId, churchId),
        isNull(members.deletedAt),
      ),
    })
  }

  /**
   * Get members by zone (via memberZones junction table)
   */
  async getMembersByZone(zoneId: string): Promise<Member[]> {
    const memberRecords = await db.query.memberZones.findMany({
      where: eq(memberZones.zoneId, zoneId),
      with: { member: true },
    })
    return memberRecords
      .map(record => record.member)
      .filter(member => !member.deletedAt)
  }

  /**
   * Assign member to zone
   */
  async assignToZone(memberId: string, zoneId: string, isLeader: boolean = false): Promise<MemberZone> {
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
  async getMemberZones(memberId: string): Promise<MemberZone[]> {
    return db.query.memberZones.findMany({
      where: eq(memberZones.memberId, memberId),
      with: { zone: true },
    })
  }

  /**
   * Get members by family
   */
  async getMembersByFamily(familyId: string): Promise<Member[]> {
    return db.query.members.findMany({
      where: and(
        eq(members.familyId, familyId),
        isNull(members.deletedAt),
      ),
    })
  }

  /**
   * Link member to family
   */
  async linkToFamily(memberId: string, familyId: string): Promise<Member> {
    const [updatedMember] = await db
      .update(members)
      .set({ familyId, updatedAt: new Date() })
      .where(eq(members.id, memberId))
      .returning()
    return updatedMember
  }
}


