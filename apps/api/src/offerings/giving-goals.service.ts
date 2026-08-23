import { Injectable } from '@nestjs/common'
import { eq, and, isNull, inArray, sql } from 'drizzle-orm'
import { db } from '@church/db'
import { givingGoals, offerings, members, type GivingGoal } from '@church/db'

export type CreateGivingGoalInput = {
  churchId: string
  name: string
  targetCents: number
  currency: string
  startDate?: string
  endDate?: string
  description?: string
  isPublic?: boolean
}

export type UpdateGivingGoalInput = Partial<Omit<CreateGivingGoalInput, 'churchId'>>

export type GoalStatus = 'upcoming' | 'active' | 'ended'

export type CurrencyTotal = { currency: string; totalCents: number }

export type GivingGoalWithProgress = GivingGoal & {
  status: GoalStatus
  raisedCents: number
  targetReached: boolean
  // Off-currency offerings linked to this goal - tracked separately per spec,
  // never blended into raisedCents (a KES total and a USD total are never summed).
  otherCurrencyTotals: CurrencyTotal[]
}

export type PublicGivingGoal = GivingGoalWithProgress & {
  donorWallNames: string[]
}

const today = () => new Date().toISOString().split('T')[0]

function deriveStatus(goal: Pick<GivingGoal, 'startDate' | 'endDate'>): GoalStatus {
  const now = today()
  if (goal.startDate > now) return 'upcoming'
  if (goal.endDate == null || goal.endDate >= now) return 'active'
  return 'ended'
}

@Injectable()
export class GivingGoalsService {
  async createGoal(data: CreateGivingGoalInput): Promise<GivingGoal> {
    const [goal] = await db
      .insert(givingGoals)
      .values({ ...data, startDate: (data.startDate ?? today()) as any })
      .returning()
    return goal
  }

  async getGoalByIdInChurch(churchId: string, goalId: string): Promise<GivingGoal | undefined> {
    const [goal] = await db.query.givingGoals.findMany({
      where: and(eq(givingGoals.id, goalId), eq(givingGoals.churchId, churchId), isNull(givingGoals.deletedAt)),
      limit: 1,
    })
    return goal
  }

  async updateGoal(churchId: string, goalId: string, data: UpdateGivingGoalInput): Promise<GivingGoal> {
    const [updated] = await db
      .update(givingGoals)
      .set({ ...data, updatedAt: today() as any })
      .where(and(eq(givingGoals.id, goalId), eq(givingGoals.churchId, churchId), isNull(givingGoals.deletedAt)))
      .returning()
    return updated
  }

  async deleteGoal(churchId: string, goalId: string) {
    return db
      .update(givingGoals)
      .set({ deletedAt: today() as any })
      .where(and(eq(givingGoals.id, goalId), eq(givingGoals.churchId, churchId), isNull(givingGoals.deletedAt)))
  }

  /**
   * Staff list - church-scoped, includes private goals. One grouped progress
   * query across all goal ids (not N+1), zipped onto the goals in memory.
   */
  async getGoalsByChurch(churchId: string): Promise<GivingGoalWithProgress[]> {
    const goals = await db.query.givingGoals.findMany({
      where: and(eq(givingGoals.churchId, churchId), isNull(givingGoals.deletedAt)),
    })
    const progressByGoal = await this.getProgressByGoal(
      churchId,
      goals.map((g) => g.id),
    )
    return goals.map((goal) => this.withProgress(goal, progressByGoal.get(goal.id)))
  }

  /**
   * Member-facing list - only isPublic goals, embedding donor-wall names.
   * CRITICAL: never returns private goals or individual offering amounts -
   * only the aggregate `raisedCents` total and opted-in donor names.
   */
  async getPublicGoalsByChurch(churchId: string): Promise<PublicGivingGoal[]> {
    const goals = await db.query.givingGoals.findMany({
      where: and(eq(givingGoals.churchId, churchId), eq(givingGoals.isPublic, true), isNull(givingGoals.deletedAt)),
    })
    const goalIds = goals.map((g) => g.id)
    const [progressByGoal, donorWallByGoal] = await Promise.all([
      this.getProgressByGoal(churchId, goalIds),
      this.getDonorWallNamesByGoal(goalIds),
    ])
    return goals.map((goal) => ({
      ...this.withProgress(goal, progressByGoal.get(goal.id)),
      donorWallNames: donorWallByGoal.get(goal.id) ?? [],
    }))
  }

  async getGoalWithProgress(churchId: string, goalId: string): Promise<GivingGoalWithProgress | undefined> {
    const goal = await this.getGoalByIdInChurch(churchId, goalId)
    if (!goal) return undefined
    const progressByGoal = await this.getProgressByGoal(churchId, [goal.id])
    return this.withProgress(goal, progressByGoal.get(goal.id))
  }

  /**
   * The individual offering rows linked to a goal, for staff reconciliation.
   * Gated at the controller on `manage:offerings`, not a giving-goals
   * permission - this is the one route that exposes raw contribution amounts.
   */
  async getOfferingsForGoal(churchId: string, goalId: string) {
    return db.query.offerings.findMany({
      where: and(eq(offerings.goalId, goalId), eq(offerings.churchId, churchId), isNull(offerings.deletedAt)),
    })
  }

  private withProgress(
    goal: GivingGoal,
    progress: { raisedCents: number; otherCurrencyTotals: CurrencyTotal[] } | undefined,
  ): GivingGoalWithProgress {
    const raisedCents = progress?.raisedCents ?? 0
    return {
      ...goal,
      status: deriveStatus(goal),
      raisedCents,
      targetReached: raisedCents >= goal.targetCents,
      otherCurrencyTotals: progress?.otherCurrencyTotals ?? [],
    }
  }

  /**
   * Progress, defined precisely per spec: sum(amount_cents) where goal_id,
   * church_id, deleted_at is null, and currency = the goal's own currency -
   * grouped by currency so off-currency rows come back as separate rows
   * instead of vanishing (surfaced here as `otherCurrencyTotals`, never
   * blended into `raisedCents`). One grouped query across all goal ids, not
   * N+1. Postgres returns sum() as a string over the wire, hence Number(...).
   */
  private async getProgressByGoal(
    churchId: string,
    goalIds: string[],
  ): Promise<Map<string, { raisedCents: number; otherCurrencyTotals: CurrencyTotal[] }>> {
    const result = new Map<string, { raisedCents: number; otherCurrencyTotals: CurrencyTotal[] }>()
    if (goalIds.length === 0) return result

    const rows = await db
      .select({
        goalId: offerings.goalId,
        currency: offerings.currency,
        totalCents: sql<string>`sum(${offerings.amountCents})`,
      })
      .from(offerings)
      .where(
        and(
          inArray(offerings.goalId, goalIds),
          eq(offerings.churchId, churchId),
          isNull(offerings.deletedAt),
        ),
      )
      .groupBy(offerings.goalId, offerings.currency)

    const goalsById = await db.query.givingGoals.findMany({ where: inArray(givingGoals.id, goalIds) })
    const currencyByGoalId = new Map(goalsById.map((g: GivingGoal) => [g.id, g.currency]))

    for (const row of rows as any[]) {
      if (!row.goalId) continue
      const entry = result.get(row.goalId) ?? { raisedCents: 0, otherCurrencyTotals: [] }
      if (row.currency === currencyByGoalId.get(row.goalId)) {
        entry.raisedCents = Number(row.totalCents)
      } else {
        entry.otherCurrencyTotals.push({ currency: row.currency, totalCents: Number(row.totalCents) })
      }
      result.set(row.goalId, entry)
    }
    return result
  }

  /**
   * Donor wall, defined precisely per spec: distinct member names for
   * offerings with showOnDonorWall = true, not deleted - no currency filter
   * (recognition is currency-agnostic). One query across all goal ids.
   * Names only - no amount, no offering id, no count is ever exposed here.
   */
  private async getDonorWallNamesByGoal(goalIds: string[]): Promise<Map<string, string[]>> {
    const result = new Map<string, string[]>()
    if (goalIds.length === 0) return result

    const rows = await db.query.offerings.findMany({
      where: and(
        inArray(offerings.goalId, goalIds),
        eq(offerings.showOnDonorWall, true),
        isNull(offerings.deletedAt),
      ),
    })
    const memberIds: string[] = Array.from(
      new Set(rows.map((r: any) => r.memberId).filter((id: any): id is string => !!id)),
    )
    const namedMembers = memberIds.length > 0
      ? await db.query.members.findMany({ where: inArray(members.id, memberIds) })
      : []
    const nameById = new Map<string, string>(
      namedMembers.map((m: any) => [m.id, [m.firstName, m.lastName].filter(Boolean).join(' ')]),
    )

    for (const row of rows as any[]) {
      if (!row.goalId || !row.memberId) continue
      const name = nameById.get(row.memberId)
      if (!name) continue
      const existing = result.get(row.goalId) ?? []
      if (!existing.includes(name)) existing.push(name)
      result.set(row.goalId, existing)
    }
    return result
  }
}
