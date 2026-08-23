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
  departments,
  engagementRiskDefaults,
  engagementRiskFlags,
  engagementRiskSettings,
  memberDepartments,
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

  async getTrends(churchId: string, input: { from: string; to: string; groupBy: 'branch' | 'zone' | 'department' | 'gender' | 'age_band' }) {
    const whereClause = and(
      eq(attendanceCheckins.churchId, churchId),
      gte(serviceSessions.sessionDate, input.from as any),
      lte(serviceSessions.sessionDate, input.to as any),
    )

    // A member can belong to multiple departments, so joining member_departments fans out
    // one row per department per check-in. Only join it when actually grouping by
    // department, otherwise gender/age_band/branch counts would be silently inflated.
    const checkinRows = input.groupBy === 'department'
      ? await db.select({
          sessionId: attendanceCheckins.sessionId,
          memberId: attendanceCheckins.memberId,
          sessionDate: serviceSessions.sessionDate,
          gender: members.gender,
          dateOfBirth: members.dateOfBirth,
          zoneId: memberZones.zoneId,
          zoneName: zones.name,
          departmentId: memberDepartments.departmentId,
          departmentName: departments.name,
        })
          .from(attendanceCheckins)
          .innerJoin(serviceSessions, eq(attendanceCheckins.sessionId, serviceSessions.id))
          .innerJoin(members, eq(attendanceCheckins.memberId, members.id))
          .leftJoin(memberZones, eq(memberZones.memberId, members.id))
          .leftJoin(zones, eq(memberZones.zoneId, zones.id))
          .leftJoin(memberDepartments, eq(memberDepartments.memberId, members.id))
          .leftJoin(departments, eq(memberDepartments.departmentId, departments.id))
          .where(whereClause)
      : await db.select({
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
          .where(whereClause)

    const keyOf = (row: any) => {
      if (input.groupBy === 'gender') return row.gender || 'unknown'
      if (input.groupBy === 'age_band') return ageBandFromDateOfBirth(row.dateOfBirth)
      // Department groupBy is fanned out (one row per department a member belongs to), so
      // summed totals across department buckets can exceed total attendance for a session.
      // That's expected ("how many choir members attended"), not a bug.
      if (input.groupBy === 'department') return row.departmentName || 'unassigned'
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

  /**
   * Get a member's own check-in history for this church (self-service)
   */
  async getMemberCheckins(churchId: string, memberId: string, limit = 20) {
    return db.select({
      checkinId: attendanceCheckins.id,
      sessionId: attendanceCheckins.sessionId,
      sessionTitle: serviceSessions.title,
      sessionDate: serviceSessions.sessionDate,
      serviceTypeName: serviceTypes.name,
      source: attendanceCheckins.source,
      checkedInAt: attendanceCheckins.createdAt,
    })
      .from(attendanceCheckins)
      .innerJoin(serviceSessions, eq(attendanceCheckins.sessionId, serviceSessions.id))
      .innerJoin(serviceTypes, eq(serviceSessions.serviceTypeId, serviceTypes.id))
      .where(and(eq(attendanceCheckins.churchId, churchId), eq(attendanceCheckins.memberId, memberId)))
      .orderBy(desc(serviceSessions.sessionDate), desc(attendanceCheckins.createdAt))
      .limit(limit)
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

    // Batch 1: Verify session exists and is open
    const [session] = await db.query.serviceSessions.findMany({
      where: and(eq(serviceSessions.id, sessionId), eq(serviceSessions.churchId, churchId), isNull(serviceSessions.deletedAt)),
    })
    if (!session) {
      memberIds.forEach(memberId => {
        failed.push({ memberId, reason: 'Session not found' })
      })
      return { success, failed, totalRequested: memberIds.length }
    }
    if (session.status !== 'open') {
      memberIds.forEach(memberId => {
        failed.push({ memberId, reason: 'Session must be open for check-in' })
      })
      return { success, failed, totalRequested: memberIds.length }
    }

    // Batch 2: Verify which members exist in church
    const existingMembers = await db.query.members.findMany({
      where: and(eq(members.churchId, churchId), inArray(members.id, memberIds), isNull(members.deletedAt)),
      columns: { id: true },
    })
    const validMemberIds = new Set(existingMembers.map(m => m.id))

    memberIds.forEach(memberId => {
      if (!validMemberIds.has(memberId)) {
        failed.push({ memberId, reason: 'Member not found in church' })
      }
    })

    // Batch 3: Check for existing checkins for this session
    const memberIdsArray = Array.from(validMemberIds)
    const existingCheckins = memberIdsArray.length > 0 ? await db.query.attendanceCheckins.findMany({
      where: and(eq(attendanceCheckins.sessionId, sessionId), inArray(attendanceCheckins.memberId, memberIdsArray as any)),
      columns: { memberId: true },
    }) : []
    const alreadyCheckedInSet = new Set(existingCheckins.map(c => c.memberId))

    const toInsert: any[] = []
    validMemberIds.forEach(memberId => {
      if (alreadyCheckedInSet.has(memberId)) {
        failed.push({ memberId, reason: 'Member already checked in for this session' })
      } else {
        toInsert.push({
          churchId,
          sessionId,
          memberId,
          source: 'manual',
        })
      }
    })

    // Batch 4: Insert all valid checkins in one query
    if (toInsert.length > 0) {
      const inserted = await db.insert(attendanceCheckins).values(toInsert).returning()
      inserted.forEach(row => {
        success.push({ memberId: row.memberId, checkinId: row.id })
      })
    }

    return { success, failed, totalRequested: memberIds.length }
  }

  async getPeriodComparison(churchId: string, input: { from: string; to: string; groupBy: 'branch' | 'zone' | 'department' | 'gender' | 'age_band' }) {
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

    if (openSessions.length === 0) {
      return []
    }

    const sessionIds = openSessions.map(s => s.id)

    // Batch query: count checkins per session using GROUP BY
    const checkinCounts = await db.select({
      sessionId: attendanceCheckins.sessionId,
      count: sql<number>`count(*)`,
    }).from(attendanceCheckins)
      .where(inArray(attendanceCheckins.sessionId, sessionIds))
      .groupBy(attendanceCheckins.sessionId)

    // Batch query: get all headcounts for these sessions
    const headcounts = await db.query.attendanceHeadcounts.findMany({
      where: inArray(attendanceHeadcounts.sessionId, sessionIds),
      columns: { sessionId: true, totalCount: true },
    })

    // Build lookup maps
    const checkinCountMap = new Map(checkinCounts.map(row => [row.sessionId, Number(row.count)]))
    const headcountMap = new Map(headcounts.map(row => [row.sessionId, row.totalCount]))

    // Join in memory and maintain original session order
    return openSessions.map(session => {
      const totalCheckins = (checkinCountMap.get(session.id) || 0) as number
      const totalHeadcount = (headcountMap.get(session.id) || 0) as number
      const gap = Math.max(0, totalHeadcount - totalCheckins)
      return {
        sessionId: session.id,
        title: session.title,
        sessionDate: session.sessionDate,
        totalCheckins,
        totalHeadcount,
        headcountGap: gap,
      }
    })
  }

  async upsertRiskProfile(churchId: string, input: { versionLabel: string; missedWeight: number; recencyWeight: number; lowThreshold: number; mediumThreshold: number; highThreshold: number; isActive: boolean }) {
    if (input.isActive) {
      await db.update(attendanceRiskProfiles).set({ isActive: false, updatedAt: new Date() }).where(eq(attendanceRiskProfiles.churchId, churchId))
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
        where: and(eq(attendanceRiskProfiles.churchId, church.churchId), eq(attendanceRiskProfiles.isActive, true)),
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

      // Batch compute all flag records
      const flagRecords = allMembers.map(member => {
        const consecutiveMissedCount = presentMemberSet.has(member.id) ? 0 : recentSessions.length
        return {
          churchId: church.churchId,
          memberId: member.id,
          consecutiveMissedCount,
          thresholdUsed: threshold,
          lastSessionDate,
        }
      })

      // Batch upsert all engagement risk flags
      if (flagRecords.length > 0) {
        await db.insert(engagementRiskFlags)
          .values(flagRecords)
          .onConflictDoUpdate({
            target: engagementRiskFlags.memberId,
            set: {
              consecutiveMissedCount: sql`EXCLUDED.consecutive_missed_count`,
              thresholdUsed: sql`EXCLUDED.threshold_used`,
              lastSessionDate: sql`EXCLUDED.last_session_date`,
              updatedAt: new Date() as any,
            },
          })
      }

      // Batch compute all history records
      const historyRecords = allMembers.map(member => {
        const consecutiveMissedCount = presentMemberSet.has(member.id) ? 0 : recentSessions.length
        const baseScore = Math.min(100, Math.round((consecutiveMissedCount / Math.max(1, threshold)) * 100))
        const riskScore = activeProfile
          ? Math.min(100, Math.round((baseScore * activeProfile.missedWeight + baseScore * activeProfile.recencyWeight) / 100))
          : baseScore

        const severity =
          activeProfile
            ? (riskScore >= activeProfile.highThreshold ? 'high' : riskScore >= activeProfile.mediumThreshold ? 'medium' : 'low')
            : (riskScore >= 85 ? 'high' : riskScore >= 60 ? 'medium' : 'low')

        return {
          churchId: church.churchId,
          memberId: member.id,
          profileId: activeProfile?.id,
          riskScore,
          severity: severity as any,
          effectiveDate: new Date().toISOString().slice(0, 10),
        }
      })

      // Batch insert all history records
      if (historyRecords.length > 0) {
        await db.insert(attendanceRiskHistory).values(historyRecords)
      }
    }
  }
}
