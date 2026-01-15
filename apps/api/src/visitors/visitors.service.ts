import { Injectable, BadRequestException } from '@nestjs/common'
import { eq, and, isNull } from 'drizzle-orm'
import { db } from '@church/db'
import { visitors, visitorFollowups, members, memberZones } from '@church/db'
import type { Visitor, VisitorFollowup } from '@church/db'


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
    // Convert visitDate to date-only string (YYYY-MM-DD)
    let visitDate: string
    if (data.visitDate) {
      if (typeof data.visitDate === 'string') {
        visitDate = data.visitDate
      } else {
        visitDate = data.visitDate.toISOString().split('T')[0]
      }
    } else {
      visitDate = new Date().toISOString().split('T')[0]
    }

    const [visitor] = await db.insert(visitors).values({
      ...data,
      visitDate: visitDate as any,
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
      .set({ ...data, updatedAt: new Date().toISOString().split('T')[0] })
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
      .set({ deletedAt: new Date().toISOString().split('T')[0] })
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
    const [newMember] = await db.insert(members).values({
      churchId: visitor.churchId,
      firstName: visitor.firstName,
      lastName: visitor.lastName,
      phone: visitor.phone,
      email: visitor.email,
      // Additional fields can be filled in by the user later
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
    await db
      .update(visitors)
      .set({ 
        convertedToMemberId: newMember.id,
        updatedAt: new Date().toISOString().split('T')[0],
        deletedAt: new Date().toISOString().split('T')[0],
      })
      .where(eq(visitors.id, data.visitorId))

    // Update followup status to converted
    await db
      .update(visitorFollowups)
      .set({ status: 'converted', updatedAt: new Date().toISOString().split('T')[0] })
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
    // Convert followupDate to date-only string (YYYY-MM-DD)
    let followupDate: string
    if (data.followupDate) {
      if (typeof data.followupDate === 'string') {
        followupDate = data.followupDate
      } else {
        followupDate = data.followupDate.toISOString().split('T')[0]
      }
    } else {
      followupDate = new Date().toISOString().split('T')[0]
    }

    const [followup] = await db.insert(visitorFollowups).values({
      ...data,
      followupDate: followupDate as any,
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
    // Convert followupDate to date-only string if provided
    const updateData: any = { ...data, updatedAt: new Date().toISOString().split('T')[0] }
    
    if (data.followupDate) {
      if (typeof data.followupDate === 'string') {
        updateData.followupDate = data.followupDate
      } else {
        updateData.followupDate = data.followupDate.toISOString().split('T')[0]
      }
    }

    const [updatedFollowup] = await db
      .update(visitorFollowups)
      .set(updateData)
      .where(eq(visitorFollowups.id, followupId))
      .returning()
    return updatedFollowup
  }
}
