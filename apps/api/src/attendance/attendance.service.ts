import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { and, desc, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm'
import { db } from '@church/db'
import {
  attendanceCheckins,
  attendanceHeadcounts,
  attendanceRiskHistory,
  attendanceRiskProfiles,
  attendanceSessionMetadata,
  attendanceSnapshots,
  engagementRiskDefaults,
  engagementRiskFlags,
  engagementRiskSettings,
  memberZones,
  members,
  serviceSessions,
  serviceTypes,
  zones,
} from '@church/db'

function formatDateOnly(input: string | Date): string {
  if (typeof input === 'string') {
    return input.slice(0, 10)
  }
  return input.toISOString().slice(0, 10)
}

function ageBandFromDateOfBirth(dateOfBirth?: string | Date | null): string {
  if (!dateOfBirth) return 'unknown'
  const date = new Date(dateOfBirth)
  if (Number.isNaN(date.getTime())) return 'unknown'
  const years = Math.floor((Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  if (years < 13) return 'child'
  if (years < 18) return 'teen'
  if (years < 36) return 'young_adult'
  if (years < 61) return 'adult'
  return 'senior'
}

@Injectable()
export class AttendanceService {
  async createServiceType(churchId: string, input: { name: string; isActive?: boolean }) {
    const [row] = await db.insert(serviceTypes).values({
      churchId,
      name: input.name.trim(),
      isActive: input.isActive ?? true,
    }).returning()
    return row
  }

  async listServiceTypes(churchId: string) {
    return db.query.serviceTypes.findMany({
      where: and(eq(serviceTypes.churchId, churchId), isNull(serviceTypes.deletedAt)),
      orderBy: [desc(serviceTypes.createdAt)],
    })
  }

  async updateServiceType(churchId: string, serviceTypeId: string, input: { name?: string; isActive?: boolean }) {
    const [existing] = await db.query.serviceTypes.findMany({
      where: and(eq(serviceTypes.id, serviceTypeId), eq(serviceTypes.churchId, churchId), isNull(serviceTypes.deletedAt)),
    })
    if (!existing) throw new NotFoundException('Service type not found')

    const [updated] = await db.update(serviceTypes)
      .set({
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        updatedAt: new Date() as any,
      })
      .where(eq(serviceTypes.id, serviceTypeId))
      .returning()

    return updated
  }

  async createSession(churchId: string, input: { serviceTypeId: string; title?: string; sessionDate: string }) {
    const [type] = await db.query.serviceTypes.findMany({
      where: and(eq(serviceTypes.id, input.serviceTypeId), eq(serviceTypes.churchId, churchId), isNull(serviceTypes.deletedAt)),
    })
    if (!type) throw new BadRequestException('Invalid service type for church')

    const qrToken = `${churchId}-${input.serviceTypeId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

    const [session] = await db.insert(serviceSessions).values({
      churchId,
      serviceTypeId: input.serviceTypeId,
      title: input.title,
      sessionDate: formatDateOnly(input.sessionDate),
      status: 'draft',
      qrToken,
    }).returning()

    return session
  }

  async listSessions(churchId: string, from?: string, to?: string) {
    const filters = [eq(serviceSessions.churchId, churchId), isNull(serviceSessions.deletedAt)]
    if (from) filters.push(gte(serviceSessions.sessionDate, from as any))
    if (to) filters.push(lte(serviceSessions.sessionDate, to as any))

    return db.query.serviceSessions.findMany({
      where: and(...filters),
      with: { serviceType: true },
      orderBy: [desc(serviceSessions.sessionDate), desc(serviceSessions.createdAt)],
    })
  }

  async updateSessionStatus(churchId: string, sessionId: string, status: 'draft' | 'open' | 'closed') {
    const [session] = await db.query.serviceSessions.findMany({
      where: and(eq(serviceSessions.id, sessionId), eq(serviceSessions.churchId, churchId), isNull(serviceSessions.deletedAt)),
    })
    if (!session) throw new NotFoundException('Session not found')

    const [updated] = await db.update(serviceSessions).set({
      status,
      openedAt: status === 'open' ? (new Date() as any) : session.openedAt,
      closedAt: status === 'closed' ? (new Date() as any) : session.closedAt,
      updatedAt: new Date() as any,
    }).where(eq(serviceSessions.id, sessionId)).returning()

    return updated
  }

  async upsertHeadcount(churchId: string, sessionId: string, input: { menCount: number; womenCount: number; childrenCount: number; visitorsCount: number }) {
    const [session] = await db.query.serviceSessions.findMany({
      where: and(eq(serviceSessions.id, sessionId), eq(serviceSessions.churchId, churchId), isNull(serviceSessions.deletedAt)),
    })
    if (!session) throw new NotFoundException('Session not found')

    const totalCount = input.menCount + input.womenCount + input.childrenCount + input.visitorsCount

    const existing = await db.query.attendanceHeadcounts.findFirst({ where: eq(attendanceHeadcounts.sessionId, sessionId) })
    if (!existing) {
      const [created] = await db.insert(attendanceHeadcounts).values({
        churchId,
        sessionId,
        ...input,
        totalCount,
      }).returning()
      return created
    }

    const [updated] = await db.update(attendanceHeadcounts).set({
      ...input,
      totalCount,
      updatedAt: new Date() as any,
    }).where(eq(attendanceHeadcounts.id, existing.id)).returning()

    return updated
  }

  private async checkin(churchId: string, sessionId: string, memberId: string, source: 'qr' | 'manual') {
    const [session] = await db.query.serviceSessions.findMany({
      where: and(eq(serviceSessions.id, sessionId), eq(serviceSessions.churchId, churchId), isNull(serviceSessions.deletedAt)),
    })
    if (!session) throw new NotFoundException('Session not found')
    if (session.status !== 'open') throw new BadRequestException('Session must be open for check-in')

    const [member] = await db.query.members.findMany({
      where: and(eq(members.id, memberId), eq(members.churchId, churchId), isNull(members.deletedAt)),
    })
    if (!member) throw new BadRequestException('Member not found in church')

    const [existing] = await db.query.attendanceCheckins.findMany({
      where: and(eq(attendanceCheckins.sessionId, sessionId), eq(attendanceCheckins.memberId, memberId)),
    })
    if (existing) throw new BadRequestException('Member already checked in for this session')

    const [checkinRow] = await db.insert(attendanceCheckins).values({
      churchId,
      sessionId,
      memberId,
      source,
    }).returning()

    return checkinRow
  }

  async manualCheckin(churchId: string, sessionId: string, memberId: string) {
    return this.checkin(churchId, sessionId, memberId, 'manual')
  }

  async qrCheckin(churchId: string, qrToken: string, memberId: string) {
    const [session] = await db.query.serviceSessions.findMany({
      where: and(eq(serviceSessions.qrToken, qrToken), eq(serviceSessions.churchId, churchId), isNull(serviceSessions.deletedAt)),
    })
    if (!session) throw new NotFoundException('Session not found for QR token')
    return this.checkin(churchId, session.id, memberId, 'qr')
  }

  async getTrends(churchId: string, input: { from: string; to: string; groupBy: 'branch' | 'zone' | 'gender' | 'age_band' }) {
    const checkinRows = await db.select({
      sessionId: attendanceCheckins.sessionId,
      memberId: attendanceCheckins.memberId,
      sessionDate: serviceSessions.sessionDate,
      gender: members.gender,
      dateOfBirth: members.dateOfBirth,
      zoneId: memberZones.zoneId,
      zoneName: zones.name,
    })
      .from(attendanceCheckins)
      .innerJoin(serviceSessions, eq(attendanceCheckins.sessionId, serviceSessions.id))
      .innerJoin(members, eq(attendanceCheckins.memberId, members.id))
      .leftJoin(memberZones, eq(memberZones.memberId, members.id))
      .leftJoin(zones, eq(memberZones.zoneId, zones.id))
      .where(and(
        eq(attendanceCheckins.churchId, churchId),
        gte(serviceSessions.sessionDate, input.from as any),
        lte(serviceSessions.sessionDate, input.to as any),
      ))

    const keyOf = (row: typeof checkinRows[number]) => {
      if (input.groupBy === 'gender') return row.gender || 'unknown'
      if (input.groupBy === 'age_band') return ageBandFromDateOfBirth(row.dateOfBirth)
      if (input.groupBy === 'branch') return row.zoneName || 'unassigned'
      return row.zoneName || 'unassigned'
    }

    const grouped = new Map<string, { group: string; totalCheckins: number; uniqueMembers: number; sessionCount: number }>()
    const memberSetByGroup = new Map<string, Set<string>>()
    const sessionSetByGroup = new Map<string, Set<string>>()

    for (const row of checkinRows) {
      const group = keyOf(row)
      const current = grouped.get(group) || { group, totalCheckins: 0, uniqueMembers: 0, sessionCount: 0 }
      current.totalCheckins += 1
      grouped.set(group, current)

      const memberSet = memberSetByGroup.get(group) || new Set<string>()
      memberSet.add(row.memberId)
      memberSetByGroup.set(group, memberSet)

      const sessionSet = sessionSetByGroup.get(group) || new Set<string>()
      sessionSet.add(row.sessionId)
      sessionSetByGroup.set(group, sessionSet)
    }

    return Array.from(grouped.values()).map((row) => ({
      ...row,
      uniqueMembers: memberSetByGroup.get(row.group)?.size || 0,
      sessionCount: sessionSetByGroup.get(row.group)?.size || 0,
      averagePerSession: (sessionSetByGroup.get(row.group)?.size || 0) > 0
        ? Number((row.totalCheckins / (sessionSetByGroup.get(row.group)?.size || 1)).toFixed(2))
        : 0,
    }))
  }

  async getRiskSettings(churchId: string) {
    const [churchSetting] = await db.query.engagementRiskSettings.findMany({ where: eq(engagementRiskSettings.churchId, churchId) })
    const [globalDefault] = await db.query.engagementRiskDefaults.findMany({ where: eq(engagementRiskDefaults.isActive, true), orderBy: [desc(engagementRiskDefaults.createdAt)] })
    return {
      churchSetting: churchSetting || null,
      globalDefault: globalDefault || null,
      effectiveThreshold: churchSetting?.isActive ? churchSetting.consecutiveMissedThreshold : (globalDefault?.consecutiveMissedThreshold || 4),
    }
  }

  async upsertRiskSettings(churchId: string, input: { consecutiveMissedThreshold: number; isActive: boolean }) {
    const [existing] = await db.query.engagementRiskSettings.findMany({ where: eq(engagementRiskSettings.churchId, churchId) })
    if (!existing) {
      const [created] = await db.insert(engagementRiskSettings).values({
        churchId,
        consecutiveMissedThreshold: input.consecutiveMissedThreshold,
        isActive: input.isActive,
      }).returning()
      return created
    }

    const [updated] = await db.update(engagementRiskSettings).set({
      consecutiveMissedThreshold: input.consecutiveMissedThreshold,
      isActive: input.isActive,
      updatedAt: new Date() as any,
    }).where(eq(engagementRiskSettings.id, existing.id)).returning()

    return updated
  }

  async getAtRiskMembers(churchId: string) {
    return db.select({
      flagId: engagementRiskFlags.id,
      memberId: members.id,
      firstName: members.firstName,
      lastName: members.lastName,
      phone: members.phone,
      consecutiveMissedCount: engagementRiskFlags.consecutiveMissedCount,
      thresholdUsed: engagementRiskFlags.thresholdUsed,
      lastSessionDate: engagementRiskFlags.lastSessionDate,
      updatedAt: engagementRiskFlags.updatedAt,
    })
      .from(engagementRiskFlags)
      .innerJoin(members, eq(engagementRiskFlags.memberId, members.id))
      .where(and(eq(engagementRiskFlags.churchId, churchId), sql`${engagementRiskFlags.consecutiveMissedCount} >= ${engagementRiskFlags.thresholdUsed}`))
      .orderBy(desc(engagementRiskFlags.consecutiveMissedCount), desc(engagementRiskFlags.updatedAt))
  }

  async upsertSessionMetadata(churchId: string, sessionId: string, input: { cadence: 'weekly' | 'biweekly' | 'monthly' | 'special'; tags: string[]; notes?: string }) {
    const [session] = await db.query.serviceSessions.findMany({
      where: and(eq(serviceSessions.id, sessionId), eq(serviceSessions.churchId, churchId), isNull(serviceSessions.deletedAt)),
    })
    if (!session) throw new NotFoundException('Session not found')

    const existing = await db.query.attendanceSessionMetadata.findFirst({ where: eq(attendanceSessionMetadata.sessionId, sessionId) })
    if (!existing) {
      const [created] = await db.insert(attendanceSessionMetadata).values({
        churchId,
        sessionId,
        cadence: input.cadence,
        tags: JSON.stringify(input.tags || []),
        notes: input.notes,
      }).returning()
      return created
    }

    const [updated] = await db.update(attendanceSessionMetadata).set({
      cadence: input.cadence,
      tags: JSON.stringify(input.tags || []),
      notes: input.notes,
      updatedAt: new Date(),
    }).where(eq(attendanceSessionMetadata.id, existing.id)).returning()
    return updated
  }

  async batchManualCheckin(churchId: string, sessionId: string, memberIds: string[]) {
    const success: any[] = []
    const failed: any[] = []
    for (const memberId of memberIds) {
      try {
        const row = await this.manualCheckin(churchId, sessionId, memberId)
        success.push({ memberId, checkinId: row.id })
      } catch (error) {
        failed.push({ memberId, reason: error instanceof Error ? error.message : 'Failed' })
      }
    }
    return { success, failed, totalRequested: memberIds.length }
  }

  async getPeriodComparison(churchId: string, input: { from: string; to: string; groupBy: 'branch' | 'zone' | 'gender' | 'age_band' }) {
    const current = await this.getTrends(churchId, input)
    const fromDate = new Date(input.from)
    const toDate = new Date(input.to)
    const dayDiff = Math.max(1, Math.ceil((toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000)))
    const prevTo = new Date(fromDate.getTime() - 24 * 60 * 60 * 1000)
    const prevFrom = new Date(prevTo.getTime() - dayDiff * 24 * 60 * 60 * 1000)

    const previous = await this.getTrends(churchId, {
      from: prevFrom.toISOString().slice(0, 10),
      to: prevTo.toISOString().slice(0, 10),
      groupBy: input.groupBy,
    })

    const prevByGroup = new Map(previous.map((row: any) => [row.group, row.totalCheckins]))
    return current.map((row: any) => {
      const prev = prevByGroup.get(row.group) || 0
      const delta = row.totalCheckins - prev
      return { ...row, previousTotalCheckins: prev, deltaCheckins: delta }
    })
  }

  async getAttendanceCohorts(churchId: string, input: { from: string; to: string }) {
    const rows = await db.select({
      memberId: attendanceCheckins.memberId,
      sessionId: attendanceCheckins.sessionId,
    }).from(attendanceCheckins)
      .innerJoin(serviceSessions, eq(attendanceCheckins.sessionId, serviceSessions.id))
      .where(and(eq(attendanceCheckins.churchId, churchId), gte(serviceSessions.sessionDate, input.from as any), lte(serviceSessions.sessionDate, input.to as any)))

    const sessionCount = await db.select({ count: sql<number>`count(*)` }).from(serviceSessions).where(and(eq(serviceSessions.churchId, churchId), gte(serviceSessions.sessionDate, input.from as any), lte(serviceSessions.sessionDate, input.to as any)))
    const totalSessions = Number(sessionCount[0]?.count || 0)
    const checkinsByMember = new Map<string, number>()
    for (const row of rows) checkinsByMember.set(row.memberId, (checkinsByMember.get(row.memberId) || 0) + 1)

    let regular = 0
    let irregular = 0
    for (const checkins of checkinsByMember.values()) {
      const ratio = totalSessions > 0 ? checkins / totalSessions : 0
      if (ratio >= 0.6) regular += 1
      else irregular += 1
    }

    return { totalSessions, totalMembers: checkinsByMember.size, regularMembers: regular, irregularMembers: irregular }
  }

  async getOpenSessionHealth(churchId: string) {
    const openSessions = await db.query.serviceSessions.findMany({
      where: and(eq(serviceSessions.churchId, churchId), eq(serviceSessions.status, 'open'), isNull(serviceSessions.deletedAt)),
      orderBy: [desc(serviceSessions.sessionDate)],
    })

    const health = []
    for (const session of openSessions) {
      const checkinCount = await db.select({ count: sql<number>`count(*)` }).from(attendanceCheckins).where(eq(attendanceCheckins.sessionId, session.id))
      const headcount = await db.query.attendanceHeadcounts.findFirst({ where: eq(attendanceHeadcounts.sessionId, session.id) })
      const totalCheckins = Number(checkinCount[0]?.count || 0)
      const gap = Math.max(0, (headcount?.totalCount || 0) - totalCheckins)
      health.push({
        sessionId: session.id,
        title: session.title,
        sessionDate: session.sessionDate,
        totalCheckins,
        totalHeadcount: headcount?.totalCount || 0,
        headcountGap: gap,
      })
    }
    return health
  }

  async upsertRiskProfile(churchId: string, input: { versionLabel: string; missedWeight: number; recencyWeight: number; lowThreshold: number; mediumThreshold: number; highThreshold: number; isActive: number }) {
    if (input.isActive === 1) {
      await db.update(attendanceRiskProfiles).set({ isActive: 0, updatedAt: new Date() }).where(eq(attendanceRiskProfiles.churchId, churchId))
    }
    const [row] = await db.insert(attendanceRiskProfiles).values({ churchId, ...input }).returning()
    return row
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async computeRiskFlagsDaily() {
    const [globalDefault] = await db.query.engagementRiskDefaults.findMany({
      where: eq(engagementRiskDefaults.isActive, true),
      orderBy: [desc(engagementRiskDefaults.createdAt)],
    })
    const defaultThreshold = globalDefault?.consecutiveMissedThreshold || 4

    const churches = await db.select({ churchId: members.churchId }).from(members).groupBy(members.churchId)

    for (const church of churches) {
      const [setting] = await db.query.engagementRiskSettings.findMany({ where: eq(engagementRiskSettings.churchId, church.churchId) })
      const threshold = setting?.isActive ? setting.consecutiveMissedThreshold : defaultThreshold
      const [activeProfile] = await db.query.attendanceRiskProfiles.findMany({
        where: and(eq(attendanceRiskProfiles.churchId, church.churchId), eq(attendanceRiskProfiles.isActive, 1)),
        orderBy: [desc(attendanceRiskProfiles.createdAt)],
      })

      const recentSessions = await db.query.serviceSessions.findMany({
        where: and(eq(serviceSessions.churchId, church.churchId), eq(serviceSessions.status, 'closed'), isNull(serviceSessions.deletedAt)),
        orderBy: [desc(serviceSessions.sessionDate)],
        limit: threshold,
      })

      if (!recentSessions.length) continue

      const sessionIds = recentSessions.map((s) => s.id)
      const sessionDates = recentSessions.map((s) => s.sessionDate).filter(Boolean)
      const lastSessionDate = sessionDates.length ? sessionDates[0] : null

      const allMembers = await db.query.members.findMany({
        where: and(eq(members.churchId, church.churchId), isNull(members.deletedAt)),
        columns: { id: true },
      })

      const presentRows = await db.select({ memberId: attendanceCheckins.memberId })
        .from(attendanceCheckins)
        .where(and(eq(attendanceCheckins.churchId, church.churchId), inArray(attendanceCheckins.sessionId, sessionIds)))

      const presentMemberSet = new Set(presentRows.map((row) => row.memberId))

      for (const member of allMembers) {
        const consecutiveMissedCount = presentMemberSet.has(member.id) ? 0 : recentSessions.length
        const baseScore = Math.min(100, Math.round((consecutiveMissedCount / Math.max(1, threshold)) * 100))
        const riskScore = activeProfile
          ? Math.min(100, Math.round((baseScore * activeProfile.missedWeight + baseScore * activeProfile.recencyWeight) / 100))
          : baseScore

        const severity =
          activeProfile
            ? (riskScore >= activeProfile.highThreshold ? 'high' : riskScore >= activeProfile.mediumThreshold ? 'medium' : 'low')
            : (riskScore >= 85 ? 'high' : riskScore >= 60 ? 'medium' : 'low')
        const [existingFlag] = await db.query.engagementRiskFlags.findMany({ where: eq(engagementRiskFlags.memberId, member.id) })

        if (!existingFlag) {
          await db.insert(engagementRiskFlags).values({
            churchId: church.churchId,
            memberId: member.id,
            consecutiveMissedCount,
            thresholdUsed: threshold,
            lastSessionDate,
          })
        } else {
          await db.update(engagementRiskFlags).set({
            consecutiveMissedCount,
            thresholdUsed: threshold,
            lastSessionDate,
            updatedAt: new Date() as any,
          }).where(eq(engagementRiskFlags.id, existingFlag.id))
        }

        await db.insert(attendanceRiskHistory).values({
          churchId: church.churchId,
          memberId: member.id,
          profileId: activeProfile?.id,
          riskScore,
          severity: severity as any,
          effectiveDate: new Date().toISOString().slice(0, 10),
        })
      }
    }
  }
}
