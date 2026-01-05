import { Injectable } from '@nestjs/common'
import { eq, and, isNull } from 'drizzle-orm'
import { db } from '@church/db'
import { families, NewFamily, Family } from '@church/db'

export type CreateFamilyInput = {
  churchId: string
  familyName: string
}

@Injectable()
export class FamiliesService {
  /**
   * Create a new family
   */
  async createFamily(data: CreateFamilyInput): Promise<Family> {
    const [family] = await db.insert(families).values(data).returning()
    return family
  }

  /**
   * Get all families in a church
   */
  async getFamiliesByChurch(churchId: string): Promise<Family[]> {
    return db.query.families.findMany({
      where: and(
        eq(families.churchId, churchId),
        isNull(families.deletedAt),
      ),
    })
  }

  /**
   * Get a single family by ID
   */
  async getFamilyById(familyId: string): Promise<Family | undefined> {
    const [family] = await db.query.families.findMany({
      where: eq(families.id, familyId),
    })
    return family
  }

  /**
   * Update family details
   */
  async updateFamily(familyId: string, data: Partial<CreateFamilyInput>): Promise<Family> {
    const [updatedFamily] = await db
      .update(families)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(families.id, familyId))
      .returning()
    return updatedFamily
  }

  /**
   * Soft delete family
   */
  async deleteFamily(familyId: string): Promise<void> {
    await db
      .update(families)
      .set({ deletedAt: new Date() })
      .where(eq(families.id, familyId))
  }
}
