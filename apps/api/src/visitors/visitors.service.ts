import { Injectable, BadRequestException } from '@nestjs/common'
import { eq, and, isNull } from 'drizzle-orm'
import { db } from '@church/db'
import { visitors, visitorFollowups, members, memberZones } from '@church/db'
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
  async getVisitorsByChurch(churchId: string): Promise<Visitor[]> {
    return db.query.visitors.findMany({
      where: and(
        eq(visitors.churchId, churchId),
        isNull(visitors.deletedAt),
      ),
    })
  }

  /**
   * Get a single visitor by ID
   */
  async getVisitorById(visitorId: string): Promise<Visitor | undefined> {
    const [visitor] = await db.query.visitors.findMany({
      where: eq(visitors.id, visitorId),
    })
    return visitor
  }

  /**
   * Update visitor details
   */
  async updateVisitor(
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
      .where(eq(visitors.id, visitorId))
      .returning()
    return updatedVisitor
  }

  /**
   * Soft delete visitor
   */
  async deleteVisitor(visitorId: string): Promise<void> {
    await db
      .update(visitors)
      .set({ deletedAt: getToday() as any })
      .where(eq(visitors.id, visitorId))
  }

  /**
   * Get visitors by status
   */
  async getVisitorsByStatus(churchId: string, status: string): Promise<Visitor[]> {
    // Note: This will require a JOIN with visitorFollowups table
    // For now, return all visitors and filter in the service layer
    return this.getVisitorsByChurch(churchId)
  }

  /**
   * Convert visitor to member
   * Creates a new member record and links the visitor to it
   */
  async convertVisitorToMember(data: {
    visitorId: string
    zoneId?: string
  }): Promise<any> {
    const visitor = await this.getVisitorById(data.visitorId)
    
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
      await db.insert(memberZones).values({
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

    return { visitor: await this.getVisitorById(data.visitorId), member: newMember }
  }

  /**
   * Create a followup entry
   */
  async createFollowup(data: {
    visitorId: string
    status: string
    notes?: string
    followupDate?: Date | string
    completedBy?: string
  }): Promise<VisitorFollowup> {
    const [followup] = await db.insert(visitorFollowups).values({
      ...data,
      followupDate: toDateString(data.followupDate || new Date()) as any,
    }).returning()
    return followup
  }

  /**
   * Get all followups for a visitor
   */
  async getFollowupsByVisitor(visitorId: string): Promise<VisitorFollowup[]> {
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
  async getLatestFollowupStatus(visitorId: string): Promise<VisitorFollowup | undefined> {
    const followups = await this.getFollowupsByVisitor(visitorId)
    return followups.length > 0 ? followups[followups.length - 1] : undefined
  }

  /**
   * Update followup entry
   */
  async updateFollowup(
    followupId: string,
    data: {
      status?: string
      notes?: string
      followupDate?: Date | string
    },
  ): Promise<VisitorFollowup> {
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
