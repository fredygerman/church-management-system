import { Injectable } from '@nestjs/common'
import { eq, and, isNull } from 'drizzle-orm'
import { db } from '@church/db'
import { churches, NewChurch, Church } from '@church/db'

@Injectable()
export class ChurchService {
  /**
   * Create a new church/branch
   */
  async createChurch(data: NewChurch): Promise<Church> {
    const [church] = await db.insert(churches).values(data).returning()
    return church
  }

  /**
   * Get all churches for current user
   */
  async getChurches(): Promise<Church[]> {
    return db.query.churches.findMany({
      where: isNull(churches.deletedAt),
    })
  }

  /**
   * Get a single church by ID
   */
  async getChurchById(churchId: string): Promise<Church | undefined> {
    const [church] = await db.query.churches.findMany({
      where: eq(churches.id, churchId),
    })
    return church
  }

  /**
   * Update church details
   */
  async updateChurch(churchId: string, data: Partial<Church>): Promise<Church> {
    const [updatedChurch] = await db
      .update(churches)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(churches.id, churchId))
      .returning()
    return updatedChurch
  }

  /**
   * Soft delete church
   */
  async deleteChurch(churchId: string): Promise<void> {
    await db
      .update(churches)
      .set({ deletedAt: new Date() })
      .where(eq(churches.id, churchId))
  }
}
