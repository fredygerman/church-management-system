import { Injectable, BadRequestException } from '@nestjs/common'
import { eq, and, isNull } from 'drizzle-orm'
import { db } from '@church/db'
import { visitors, visitorFollowups, members, memberZones, zones } from '@church/db'
import type { Visitor, VisitorFollowup } from '@church/db'
import { toDateString, getToday } from '@church/config'


@Injectable()
export class VisitorsService {
  /**
   * Create a new visitor entry
   */
  async createVisitor(data: {
    churchId: string
    firstName: string
    lastName: string
    phone?: string
    email?: string
    visitDate?: Date | string
    visitorSource?: string
    referredByMemberId?: string
  }): Promise<Visitor> {
    const [visitor] = await db.insert(visitors).values({
      ...data,
      visitDate: toDateString(data.visitDate || new Date()) as any,
    }).returning()
    return visitor
  }

  /**
   * Get all visitors in a church
   */
  async getVisitorsByChurch(churchId: string, limit?: number, offset?: number): Promise<Visitor[]> {
    const effectiveLimit = limit ?? 200
    const effectiveOffset = offset ?? 0
    return db.query.visitors.findMany({
      where: and(
        eq(visitors.churchId, churchId),
        isNull(visitors.deletedAt),
      ),
      limit: effectiveLimit,
      offset: effectiveOffset,
    })
  }

  /**
   * Get a single visitor by ID
   */
  async getVisitorById(churchId: string, visitorId: string): Promise<Visitor | undefined> {
    const [visitor] = await db.query.visitors.findMany({
      where: and(eq(visitors.id, visitorId), eq(visitors.churchId, churchId), isNull(visitors.deletedAt)),
    })
    return visitor
  }

  /**
   * Update visitor details
   */
  async updateVisitor(
    churchId: string,
    visitorId: string,
    data: {
      firstName?: string
      lastName?: string
      phone?: string
      email?: string
      visitorSource?: string
      referredByMemberId?: string
    },
  ): Promise<Visitor> {
    const [updatedVisitor] = await db
      .update(visitors)
      .set({ ...data, updatedAt: toDateString(new Date()) as any })
      .where(and(eq(visitors.id, visitorId), eq(visitors.churchId, churchId), isNull(visitors.deletedAt)))
      .returning()
    return updatedVisitor
  }

  /**
   * Soft delete visitor
   */
  async deleteVisitor(churchId: string, visitorId: string): Promise<void> {
    const visitor = await this.getVisitorById(churchId, visitorId)
    if (!visitor) {
      throw new BadRequestException(`Visitor with ID ${visitorId} not found`)
    }

    await db
      .update(visitors)
      .set({ deletedAt: getToday() as any })
      .where(and(eq(visitors.id, visitorId), eq(visitors.churchId, churchId), isNull(visitors.deletedAt)))
  }

  /**
   * Get visitors by status (filters by latest followup status)
   */
  async getVisitorsByStatus(churchId: string, status: string): Promise<Visitor[]> {
    const visitors = await this.getVisitorsByChurch(churchId)
    const result: Visitor[] = []

    for (const visitor of visitors) {
      const latest = await this.getLatestFollowupStatus(churchId, visitor.id)
      if (latest?.status === status) {
        result.push(visitor)
      }
    }

    return result
  }

  /**
   * Convert visitor to member
   * Creates a new member record and links the visitor to it
   */
  async convertVisitorToMember(data: {
    churchId: string
    visitorId: string
    zoneId?: string
  }): Promise<any> {
    const visitor = await this.getVisitorById(data.churchId, data.visitorId)
    
    if (!visitor) {
      throw new BadRequestException(`Visitor with ID ${data.visitorId} not found`)
    }

    if (visitor.convertedToMemberId) {
      throw new BadRequestException('Visitor is already converted to a member')
    }

    // Create new member from visitor data
    // Only copy visitor fields that exist; nullable fields are set to NULL
    const [newMember] = await db.insert(members).values({
      churchId: visitor.churchId,
      firstName: visitor.firstName,
      lastName: visitor.lastName,
      phone: visitor.phone,
      dateOfBirth: null,
      gender: null,
      maritalStatus: null,
    }).returning()

    // Assign to zone if provided
    if (data.zoneId) {
      const [zone] = await db.query.zones.findMany({
        where: and(eq(zones.id, data.zoneId), eq(zones.churchId, data.churchId), isNull(zones.deletedAt)),
        limit: 1,
      })
      if (!zone) {
        throw new BadRequestException('Zone not found in church context')
      }
      await db.insert(memberZones).values({
        churchId: data.churchId,
        memberId: newMember.id,
        zoneId: data.zoneId,
        isLeader: false,
      })
    }

    // Update visitor to mark as converted and soft-delete the visitor
    const today = getToday()
    await db
      .update(visitors)
      .set({ 
        convertedToMemberId: newMember.id,
        updatedAt: today as any,
        deletedAt: today as any,
      })
      .where(eq(visitors.id, data.visitorId))

    // Update followup status to converted
    await db
      .update(visitorFollowups)
      .set({ status: 'converted', updatedAt: today as any })
      .where(eq(visitorFollowups.visitorId, data.visitorId))

    return { visitor: await this.getVisitorById(data.churchId, data.visitorId), member: newMember }
  }

  /**
   * Create a followup entry
   */
  async createFollowup(data: {
    churchId: string
    visitorId: string
    status: string
    notes?: string
    followupDate?: Date | string
    completedBy?: string
  }): Promise<VisitorFollowup> {
    const { churchId, ...followupData } = data
    const visitor = await this.getVisitorById(churchId, data.visitorId)

    if (!visitor) {
      throw new BadRequestException(`Visitor with ID ${data.visitorId} not found`)
    }

    const [followup] = await db.insert(visitorFollowups).values({
      ...followupData,
      followupDate: toDateString(data.followupDate || new Date()) as any,
    }).returning()
    return followup
  }

  /**
   * Get all followups for a visitor
   */
  async getFollowupsByVisitor(churchId: string, visitorId: string): Promise<VisitorFollowup[]> {
    const visitor = await this.getVisitorById(churchId, visitorId)
    if (!visitor) return []

    return db.query.visitorFollowups.findMany({
      where: and(
        eq(visitorFollowups.visitorId, visitorId),
        isNull(visitorFollowups.deletedAt),
      ),
    })
  }

  /**
   * Get latest followup status for a visitor
   */
  async getLatestFollowupStatus(churchId: string, visitorId: string): Promise<VisitorFollowup | undefined> {
    const followups = await this.getFollowupsByVisitor(churchId, visitorId)
    return followups.length > 0 ? followups[followups.length - 1] : undefined
  }

  /**
   * Update followup entry
   */
  async updateFollowup(
    churchId: string,
    followupId: string,
    data: {
      status?: string
      notes?: string
      followupDate?: Date | string
    },
  ): Promise<VisitorFollowup> {
    const [followup] = await db.query.visitorFollowups.findMany({
      where: eq(visitorFollowups.id, followupId),
    })

    if (!followup) {
      throw new BadRequestException(`Followup with ID ${followupId} not found`)
    }

    const visitor = await this.getVisitorById(churchId, followup.visitorId)
    if (!visitor) {
      throw new BadRequestException('Followup does not belong to this church')
    }

    const updateData: any = { ...data, updatedAt: getToday() }

    if (data.followupDate) {
      updateData.followupDate = toDateString(data.followupDate)
    }

    const [updatedFollowup] = await db
      .update(visitorFollowups)
      .set(updateData)
      .where(eq(visitorFollowups.id, followupId))
      .returning()
    return updatedFollowup
  }
}
