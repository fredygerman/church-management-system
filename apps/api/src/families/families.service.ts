import { Injectable, NotFoundException } from '@nestjs/common'
import { eq, and, isNull } from 'drizzle-orm'
import { db } from '@church/db'
import { families, members, NewFamily, Family } from '@church/db'

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
  async getFamilyById(churchId: string, familyId: string): Promise<Family | undefined> {
    const [family] = await db.query.families.findMany({
      where: and(eq(families.id, familyId), eq(families.churchId, churchId), isNull(families.deletedAt)),
    })
    return family
  }

  /**
   * Get a member's own family plus spouse and other linked members (self-service)
   */
  async getFamilyForMember(churchId: string, familyId: string, memberId: string) {
    const family = await this.getFamilyById(churchId, familyId)
    if (!family) return null

    const familyMembers = await db.query.members.findMany({
      where: and(
        eq(members.churchId, churchId),
        eq(members.familyId, familyId),
        isNull(members.deletedAt),
      ),
    })

    const spouse = familyMembers.find((member) => member.id === family.spouseId) ?? null

    return {
      family,
      spouse,
      members: familyMembers.filter((member) => member.id !== memberId),
    }
  }

  /**
   * Update family details
   */
  async updateFamily(churchId: string, familyId: string, data: Partial<CreateFamilyInput>): Promise<Family> {
    const [updatedFamily] = await db
      .update(families)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(families.id, familyId), eq(families.churchId, churchId), isNull(families.deletedAt)))
      .returning()
    if (!updatedFamily) throw new NotFoundException('Family not found')
    return updatedFamily
  }

  /**
   * Soft delete family
   */
  async deleteFamily(churchId: string, familyId: string): Promise<void> {
    const family = await this.getFamilyById(churchId, familyId)
    if (!family) throw new NotFoundException('Family not found')
    await db
      .update(families)
      .set({ deletedAt: new Date() })
      .where(and(eq(families.id, familyId), eq(families.churchId, churchId), isNull(families.deletedAt)))
  }
}
