import { Injectable } from '@nestjs/common'
import { eq, and, isNull, or, ilike, asc, desc, count, type SQL } from 'drizzle-orm'
import { db } from '@church/db'
import { members, memberZones, zones, userChurchMemberships, type Member, type MemberZone } from '@church/db'
import { MEMBER_SORTS, type MemberListQuery } from './members-list'

// Escape LIKE wildcards so user input is matched literally inside `%...%`.
const containsPattern = (value: string) => `%${value.replace(/[\\%_]/g, (c) => `\\${c}`)}%`

/**
 * Church-scoped, soft-delete-excluding WHERE clause for the member list.
 * Shared by the page query and the count query so totals always match rows.
 */
export function buildMemberListWhere(churchId: string, query: MemberListQuery): SQL | undefined {
  const conditions: (SQL | undefined)[] = [
    eq(members.churchId, churchId),
    isNull(members.deletedAt),
  ]
  if (query.firstName) conditions.push(ilike(members.firstName, containsPattern(query.firstName)))
  if (query.lastName) conditions.push(ilike(members.lastName, containsPattern(query.lastName)))
  if (query.occupation) conditions.push(ilike(members.occupation, containsPattern(query.occupation)))
  if (query.gender) conditions.push(eq(members.gender, query.gender))
  if (query.maritalStatus) conditions.push(eq(members.maritalStatus, query.maritalStatus))
  return and(...conditions)
}

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
  async getMembersByChurch(churchId: string, limit?: number, offset?: number): Promise<Member[]> {
    const effectiveLimit = limit ?? 200
    const effectiveOffset = offset ?? 0
    return db.query.members.findMany({
      where: and(
        eq(members.churchId, churchId),
        isNull(members.deletedAt),
      ),
      limit: effectiveLimit,
      offset: effectiveOffset,
    })
  }

  /**
   * Paged, filtered member list plus the total count for the same filters
   */
  async listMembers(churchId: string, query: MemberListQuery): Promise<{ rows: Member[]; total: number }> {
    const where = buildMemberListWhere(churchId, query)
    const sort = MEMBER_SORTS[query.sort]
    const sortColumn = members[sort.column]
    const orderBy = sort.direction === 'desc' ? desc(sortColumn) : asc(sortColumn)

    const [rows, [countRow]] = await Promise.all([
      db
        .select()
        .from(members)
        .where(where)
        .orderBy(orderBy, asc(members.id))
        .limit(query.limit)
        .offset(query.offset),
      db.select({ value: count() }).from(members).where(where),
    ])
    return { rows, total: Number(countRow?.value ?? 0) }
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
   * Get the member record linked to the caller's own membership in this church (self-service)
   */
  async getMemberByUserId(churchId: string, userId: string): Promise<Member | undefined> {
    const [membership] = await db
      .select({ memberId: userChurchMemberships.memberId })
      .from(userChurchMemberships)
      .where(and(
        eq(userChurchMemberships.userId, userId),
        eq(userChurchMemberships.churchId, churchId),
        isNull(userChurchMemberships.deletedAt),
      ))
      .limit(1)

    if (!membership?.memberId) return undefined
    return this.getMemberById(churchId, membership.memberId)
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
      .values({ churchId, memberId, zoneId, isLeader })
      .returning()
    return assignment
  }

  /**
   * Remove member from zone
   */
  async removeFromZone(churchId: string, memberId: string, zoneId: string): Promise<void> {
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
