import { Injectable, BadRequestException } from '@nestjs/common'
import { eq, and, isNull, gte, lte, sql, inArray } from 'drizzle-orm'
import { db } from '@church/db'
import {
  offerings,
  offeringCategories,
  members,
  givingGoals,
  type Offering,
  type OfferingCategory,
} from '@church/db'

export type CreateOfferingCategoryInput = {
  churchId: string
  name: string
  description?: string
}

export type CreateOfferingInput = {
  churchId: string
  categoryId: string
  memberId?: string
  sessionId?: string
  amountCents: number
  currency: string
  offeringDate: string
  note?: string
  goalId?: string | null
  showOnDonorWall?: boolean
}

export type OfferingFilters = {
  categoryId?: string
  memberId?: string
  sessionId?: string
  from?: string
  to?: string
  goalId?: string
}

export type SummaryReportInput = {
  groupBy: 'category' | 'period'
  period?: 'week' | 'month' | 'year'
  from?: string
  to?: string
}

export type SummaryReportRow = {
  groupKey: string
  currency: string
  totalCents: number
}

const today = () => new Date().toISOString().split('T')[0]

@Injectable()
export class OfferingsService {
  // ---- Offering categories ----

  async createCategory(data: CreateOfferingCategoryInput): Promise<OfferingCategory> {
    const [category] = await db.insert(offeringCategories).values(data).returning()
    return category
  }

  async getCategoriesByChurch(churchId: string): Promise<OfferingCategory[]> {
    return db.query.offeringCategories.findMany({
      where: and(eq(offeringCategories.churchId, churchId), isNull(offeringCategories.deletedAt)),
    })
  }

  async getCategoryByIdInChurch(churchId: string, categoryId: string): Promise<OfferingCategory | undefined> {
    const [category] = await db.query.offeringCategories.findMany({
      where: and(
        eq(offeringCategories.id, categoryId),
        eq(offeringCategories.churchId, churchId),
        isNull(offeringCategories.deletedAt),
      ),
      limit: 1,
    })
    return category
  }

  async updateCategory(
    churchId: string,
    categoryId: string,
    data: Partial<CreateOfferingCategoryInput>,
  ): Promise<OfferingCategory> {
    const [updated] = await db
      .update(offeringCategories)
      .set({ ...data, updatedAt: today() as any })
      .where(and(
        eq(offeringCategories.id, categoryId),
        eq(offeringCategories.churchId, churchId),
        isNull(offeringCategories.deletedAt),
      ))
      .returning()
    return updated
  }

  async deleteCategory(churchId: string, categoryId: string): Promise<void> {
    await db
      .update(offeringCategories)
      .set({ deletedAt: today() as any })
      .where(and(
        eq(offeringCategories.id, categoryId),
        eq(offeringCategories.churchId, churchId),
        isNull(offeringCategories.deletedAt),
      ))
  }

  // ---- Offerings ----

  /**
   * A goalId must point at a real, same-church, non-soft-deleted giving goal -
   * the FK alone doesn't know about churches. showOnDonorWall can only be true
   * when a member is attached; an anonymous offering has no name to show.
   */
  private async validateGoalLink(churchId: string, goalId: string | null | undefined): Promise<void> {
    if (!goalId) return
    const [goal] = await db.query.givingGoals.findMany({
      where: and(eq(givingGoals.id, goalId), eq(givingGoals.churchId, churchId), isNull(givingGoals.deletedAt)),
      limit: 1,
    })
    if (!goal) {
      throw new BadRequestException(`Giving goal with ID ${goalId} not found in this church`)
    }
  }

  private validateDonorWall(showOnDonorWall: boolean | undefined, memberId: string | null | undefined): void {
    if (showOnDonorWall === true && !memberId) {
      throw new BadRequestException('showOnDonorWall requires a memberId - anonymous offerings cannot be shown')
    }
  }

  async createOffering(data: CreateOfferingInput): Promise<Offering> {
    await this.validateGoalLink(data.churchId, data.goalId)
    this.validateDonorWall(data.showOnDonorWall, data.memberId)

    const [offering] = await db.insert(offerings).values(data).returning()
    return offering
  }

  async getOfferingsByChurch(
    churchId: string,
    filters: OfferingFilters = {},
    limit?: number,
    offset?: number,
  ): Promise<(Offering & { memberName: string | null })[]> {
    const effectiveLimit = limit ?? 200
    const effectiveOffset = offset ?? 0
    const rows = await db.query.offerings.findMany({
      where: and(
        eq(offerings.churchId, churchId),
        isNull(offerings.deletedAt),
        filters.categoryId ? eq(offerings.categoryId, filters.categoryId) : undefined,
        filters.memberId ? eq(offerings.memberId, filters.memberId) : undefined,
        filters.sessionId ? eq(offerings.sessionId, filters.sessionId) : undefined,
        filters.from ? gte(offerings.offeringDate, filters.from as any) : undefined,
        filters.to ? lte(offerings.offeringDate, filters.to as any) : undefined,
        filters.goalId ? eq(offerings.goalId, filters.goalId) : undefined,
      ),
      limit: effectiveLimit,
      offset: effectiveOffset,
    })

    const memberIds: string[] = Array.from(
      new Set(rows.map((r) => r.memberId).filter((id): id is string => !!id)),
    )
    if (memberIds.length === 0) {
      return rows.map((row) => ({ ...row, memberName: null }))
    }

    const namedMembers = await db.query.members.findMany({ where: inArray(members.id, memberIds) })
    const nameById = new Map(
      namedMembers.map((m: any) => [m.id, [m.firstName, m.lastName].filter(Boolean).join(' ')]),
    )

    return rows.map((row) => ({
      ...row,
      memberName: row.memberId ? (nameById.get(row.memberId) ?? null) : null,
    }))
  }

  async getOfferingByIdInChurch(churchId: string, offeringId: string): Promise<Offering | undefined> {
    const [offering] = await db.query.offerings.findMany({
      where: and(eq(offerings.id, offeringId), eq(offerings.churchId, churchId), isNull(offerings.deletedAt)),
      limit: 1,
    })
    return offering
  }

  async updateOffering(
    churchId: string,
    offeringId: string,
    data: Partial<CreateOfferingInput>,
  ): Promise<Offering> {
    if (data.goalId !== undefined) {
      await this.validateGoalLink(churchId, data.goalId)
    }
    if (data.showOnDonorWall === true) {
      // memberId may not be part of this patch - fall back to the record's
      // current memberId to determine the effective (post-update) value.
      const effectiveMemberId =
        data.memberId !== undefined ? data.memberId : (await this.getOfferingByIdInChurch(churchId, offeringId))?.memberId
      this.validateDonorWall(data.showOnDonorWall, effectiveMemberId)
    }

    const [updated] = await db
      .update(offerings)
      .set({ ...data, updatedAt: today() as any })
      .where(and(eq(offerings.id, offeringId), eq(offerings.churchId, churchId), isNull(offerings.deletedAt)))
      .returning()
    return updated
  }

  async deleteOffering(churchId: string, offeringId: string): Promise<void> {
    await db
      .update(offerings)
      .set({ deletedAt: today() as any })
      .where(and(eq(offerings.id, offeringId), eq(offerings.churchId, churchId), isNull(offerings.deletedAt)))
  }

  /**
   * Self-service: the caller's own named offerings only. Filtering strictly on
   * `memberId = :memberId` naturally excludes anonymous rows (memberId IS NULL,
   * which never equals any concrete id) and every other member's rows - no
   * separate "is this anonymous" check is needed. Joins the category name
   * directly since a plain member has no `manage:offerings` access to resolve
   * category names via a separate lookup.
   */
  async getMyOfferings(churchId: string, memberId: string): Promise<(Offering & { categoryName: string | null })[]> {
    const rows = await db.query.offerings.findMany({
      where: and(
        eq(offerings.churchId, churchId),
        eq(offerings.memberId, memberId),
        isNull(offerings.deletedAt),
      ),
    })
    const categories = await db.query.offeringCategories.findMany({
      where: eq(offeringCategories.churchId, churchId),
    })
    const nameById = new Map(categories.map((c: OfferingCategory) => [c.id, c.name]))

    return rows.map((row) => ({ ...row, categoryName: nameById.get(row.categoryId) ?? null }))
  }

  /**
   * Aggregate giving totals, grouped by the requested dimension (category or
   * period) AND currency together - a KES total and a USD total are never
   * summed into one figure, each (dimension, currency) pair is its own row.
   * Uses Postgres `sum(amount_cents)`, an exact integer aggregate - no JS
   * floating-point arithmetic is involved in computing the totals.
   */
  async getSummaryReport(churchId: string, input: SummaryReportInput): Promise<SummaryReportRow[]> {
    const dateFilters = [
      input.from ? gte(offerings.offeringDate, input.from as any) : undefined,
      input.to ? lte(offerings.offeringDate, input.to as any) : undefined,
    ]

    if (input.groupBy === 'category') {
      const rows = await db
        .select({
          groupKey: offerings.categoryId,
          currency: offerings.currency,
          totalCents: sql<string>`sum(${offerings.amountCents})`,
        })
        .from(offerings)
        .where(and(eq(offerings.churchId, churchId), isNull(offerings.deletedAt), ...dateFilters))
        .groupBy(offerings.categoryId, offerings.currency)

      return rows.map((row: any) => ({ ...row, totalCents: Number(row.totalCents) }))
    }

    // groupBy === 'period': bucket offeringDate via Postgres date_trunc, still
    // grouped by currency alongside the period bucket.
    const period = input.period ?? 'month'
    const periodExpr = sql`date_trunc(${period}, ${offerings.offeringDate})`

    const rows = await db
      .select({
        groupKey: sql<string>`to_char(${periodExpr}, 'YYYY-MM-DD')`,
        currency: offerings.currency,
        totalCents: sql<string>`sum(${offerings.amountCents})`,
      })
      .from(offerings)
      .where(and(eq(offerings.churchId, churchId), isNull(offerings.deletedAt), ...dateFilters))
      .groupBy(periodExpr, offerings.currency)
      .orderBy(periodExpr)

    return rows.map((row: any) => ({ ...row, totalCents: Number(row.totalCents) }))
  }
}
