import { Injectable, NotFoundException } from '@nestjs/common'
import { and, asc, desc, eq, gte, isNull, lte, sql } from 'drizzle-orm'
import { db } from '@church/db'
import {
  families,
  familyConnectionSuggestions,
  familyRelationships,
  lifecycleMilestones,
  memberZones,
  members,
  milestoneNotificationRules,
  zones,
} from '@church/db'
import { Cron, CronExpression } from '@nestjs/schedule'

@Injectable()
export class FamilyLifecycleService {
  async createRelationship(churchId: string, userId: string, input: { familyId: string; memberId: string; role: 'head' | 'spouse' | 'child' | 'guardian' | 'other'; status?: 'pending' | 'confirmed' }) {
    const [row] = await db.insert(familyRelationships).values({
      churchId,
      familyId: input.familyId,
      memberId: input.memberId,
      role: input.role,
      status: input.status || 'confirmed',
      createdBy: userId,
    }).returning()

    await db.update(members).set({ familyId: input.familyId, updatedAt: new Date() as any }).where(eq(members.id, input.memberId))
    return row
  }

  async removeRelationship(churchId: string, relationshipId: string) {
    const [row] = await db.query.familyRelationships.findMany({ where: and(eq(familyRelationships.id, relationshipId), eq(familyRelationships.churchId, churchId)) })
    if (!row) throw new NotFoundException('Relationship not found')
    await db.delete(familyRelationships).where(eq(familyRelationships.id, relationshipId))
    return { success: true }
  }

  async listRelationships(churchId: string, familyId?: string) {
    const filters = [eq(familyRelationships.churchId, churchId)]
    if (familyId) filters.push(eq(familyRelationships.familyId, familyId))

    return db.select({
      relationshipId: familyRelationships.id,
      familyId: familyRelationships.familyId,
      familyName: families.familyName,
      memberId: familyRelationships.memberId,
      firstName: members.firstName,
      lastName: members.lastName,
      role: familyRelationships.role,
      status: familyRelationships.status,
      createdAt: familyRelationships.createdAt,
    }).from(familyRelationships)
      .innerJoin(families, eq(familyRelationships.familyId, families.id))
      .innerJoin(members, eq(familyRelationships.memberId, members.id))
      .where(and(...filters))
      .orderBy(desc(familyRelationships.createdAt))
  }

  async createMilestoneRule(churchId: string, input: { milestoneType: 'birthday' | 'anniversary' | 'baptism' | 'custom'; customMilestoneName?: string; channel: 'sms' | 'email'; notifyTarget: 'member' | 'family_head' | 'leader' | 'admin'; leadDays: string; isActive?: boolean }) {
    const [row] = await db.insert(milestoneNotificationRules).values({
      churchId,
      milestoneType: input.milestoneType,
      customMilestoneName: input.customMilestoneName,
      channel: input.channel,
      notifyTarget: input.notifyTarget,
      leadDays: input.leadDays,
      isActive: input.isActive ?? true,
    }).returning()
    return row
  }

  async listMilestoneRules(churchId: string) {
    return db.query.milestoneNotificationRules.findMany({ where: eq(milestoneNotificationRules.churchId, churchId), orderBy: [desc(milestoneNotificationRules.createdAt)] })
  }

  async createLifecycleMilestone(churchId: string, input: { memberId: string; familyId?: string; milestoneType: 'birthday' | 'anniversary' | 'baptism' | 'custom'; label: string; milestoneDate: string; notificationRuleId?: string; details?: string }) {
    const [row] = await db.insert(lifecycleMilestones).values({
      churchId,
      memberId: input.memberId,
      familyId: input.familyId,
      milestoneType: input.milestoneType,
      label: input.label,
      milestoneDate: input.milestoneDate,
      notificationRuleId: input.notificationRuleId,
      details: input.details,
    }).returning()
    return row
  }

  async listLifecycleMilestones(churchId: string, from?: string, to?: string) {
    const filters = [eq(lifecycleMilestones.churchId, churchId)]
    if (from) filters.push(gte(lifecycleMilestones.milestoneDate, from as any))
    if (to) filters.push(lte(lifecycleMilestones.milestoneDate, to as any))

    return db.query.lifecycleMilestones.findMany({ where: and(...filters), orderBy: [asc(lifecycleMilestones.milestoneDate)] })
  }

  async listSuggestions(churchId: string) {
    return db.query.familyConnectionSuggestions.findMany({ where: and(eq(familyConnectionSuggestions.churchId, churchId), eq(familyConnectionSuggestions.status, 'pending')), orderBy: [desc(familyConnectionSuggestions.createdAt)] })
  }

  async resolveSuggestion(churchId: string, suggestionId: string, decision: 'approved' | 'declined' | 'ignored') {
    const [suggestion] = await db.query.familyConnectionSuggestions.findMany({ where: and(eq(familyConnectionSuggestions.id, suggestionId), eq(familyConnectionSuggestions.churchId, churchId)) })
    if (!suggestion) throw new NotFoundException('Suggestion not found')

    await db.update(familyConnectionSuggestions).set({ status: decision, resolvedAt: new Date() }).where(eq(familyConnectionSuggestions.id, suggestionId))

    if (decision === 'approved' && suggestion.suggestedFamilyId) {
      await this.createRelationship(churchId, '00000000-0000-0000-0000-000000000000', {
        familyId: suggestion.suggestedFamilyId,
        memberId: suggestion.memberId,
        role: 'other',
        status: 'confirmed',
      })
    }

    return { success: true, status: decision }
  }

  async getDashboard(churchId: string) {
    const now = new Date().toISOString().slice(0, 10)
    const next30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    const upcomingMilestones = await db.query.lifecycleMilestones.findMany({
      where: and(eq(lifecycleMilestones.churchId, churchId), gte(lifecycleMilestones.milestoneDate, now as any), lte(lifecycleMilestones.milestoneDate, next30 as any)),
      orderBy: [asc(lifecycleMilestones.milestoneDate)],
      limit: 20,
    })

    const pendingConnections = await this.listSuggestions(churchId)
    const recentRelationships = await db.query.familyRelationships.findMany({ where: eq(familyRelationships.churchId, churchId), orderBy: [desc(familyRelationships.updatedAt)], limit: 20 })

    return { upcomingMilestones, pendingConnections, recentRelationships }
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async refreshFamilySuggestions() {
    const churchRows = await db.selectDistinct({ churchId: members.churchId }).from(members).where(isNull(members.deletedAt))
    for (const church of churchRows) {
      const memberRows = await db.query.members.findMany({ where: and(eq(members.churchId, church.churchId), isNull(members.deletedAt)) })
      const familyRows = await db.query.families.findMany({ where: and(eq(families.churchId, church.churchId), isNull(families.deletedAt)) })

      for (const member of memberRows) {
        if (member.familyId) continue
        const match = familyRows.find((family) => family.familyName?.toLowerCase() === member.lastName?.toLowerCase())
        if (!match) continue

        const existing = await db.query.familyConnectionSuggestions.findFirst({
          where: and(eq(familyConnectionSuggestions.churchId, church.churchId), eq(familyConnectionSuggestions.memberId, member.id), eq(familyConnectionSuggestions.suggestedFamilyId, match.id)),
        })
        if (existing && existing.status === 'declined') continue
        if (existing) continue

        await db.insert(familyConnectionSuggestions).values({
          churchId: church.churchId,
          memberId: member.id,
          suggestedFamilyId: match.id,
          reason: 'Last name similarity',
        })
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async buildDailyMilestoneQueue() {
    const today = new Date().toISOString().slice(0, 10)
    const rules = await db.query.milestoneNotificationRules.findMany({ where: eq(milestoneNotificationRules.isActive, true) })

    for (const rule of rules) {
      const leadDays = Number(rule.leadDays || '0')
      const targetDate = new Date(Date.now() + leadDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

      if (rule.milestoneType === 'birthday') {
        const memberRows = await db.query.members.findMany({ where: and(eq(members.churchId, rule.churchId), isNull(members.deletedAt)) })
        for (const member of memberRows) {
          if (!member.dateOfBirth) continue
          const d = new Date(member.dateOfBirth)
          const yyyy = Number(targetDate.slice(0, 4))
          const mmdd = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          const targetMmdd = targetDate.slice(5)
          if (mmdd !== targetMmdd) continue

          const exists = await db.query.lifecycleMilestones.findFirst({
            where: and(eq(lifecycleMilestones.churchId, rule.churchId), eq(lifecycleMilestones.memberId, member.id), eq(lifecycleMilestones.label, 'Birthday'), eq(lifecycleMilestones.milestoneDate, targetDate as any)),
          })
          if (exists) continue

          await db.insert(lifecycleMilestones).values({
            churchId: rule.churchId,
            memberId: member.id,
            familyId: member.familyId,
            milestoneType: 'birthday',
            label: 'Birthday',
            milestoneDate: targetDate,
            notificationRuleId: rule.id,
            status: 'pending',
            details: `Auto-generated birthday milestone for ${yyyy}`,
          })
        }
      }
    }
  }
}
