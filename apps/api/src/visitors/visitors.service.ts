import { Injectable } from '@nestjs/common'
import { eq, and, isNull } from 'drizzle-orm'
import { db } from '@church/db'
import { visitors, visitorFollowups, NewVisitor, Visitor } from '@church/db'

export type CreateVisitorInput = {
  churchId: string
  firstName: string
  lastName: string
  phone?: string
  email?: string
  visitDate?: Date
}

export type CreateVisitorFollowupInput = {
  visitorId: string
  status: 'none' | 'called' | 'visited' | 'converted' | 'dropped'
  notes?: string
  followupDate?: Date
  completedBy?: string
}

@Injectable()
export class VisitorsService {
  /**
   * Create a new visitor entry
   */
  async createVisitor(data: CreateVisitorInput): Promise<Visitor> {
    const [visitor] = await db.insert(visitors).values({
      ...data,
      visitDate: data.visitDate || new Date(),
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
  async updateVisitor(visitorId: string, data: Partial<CreateVisitorInput>): Promise<Visitor> {
    const [updatedVisitor] = await db
      .update(visitors)
      .set({ ...data, updatedAt: new Date() })
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
      .set({ deletedAt: new Date() })
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
   * Create a followup entry
   */
  async createFollowup(data: CreateVisitorFollowupInput): Promise<any> {
    const [followup] = await db.insert(visitorFollowups).values({
      ...data,
      followupDate: data.followupDate || new Date(),
    }).returning()
    return followup
  }

  /**
   * Get all followups for a visitor
   */
  async getFollowupsByVisitor(visitorId: string): Promise<any[]> {
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
  async getLatestFollowupStatus(visitorId: string): Promise<any | undefined> {
    const followups = await this.getFollowupsByVisitor(visitorId)
    return followups.length > 0 ? followups[followups.length - 1] : undefined
  }

  /**
   * Update followup entry
   */
  async updateFollowup(followupId: string, data: Partial<CreateVisitorFollowupInput>): Promise<any> {
    const [updatedFollowup] = await db
      .update(visitorFollowups)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(visitorFollowups.id, followupId))
      .returning()
    return updatedFollowup
  }
}
