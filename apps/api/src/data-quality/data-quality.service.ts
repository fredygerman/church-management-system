import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { and, eq, ilike, isNull, sql } from 'drizzle-orm'
import { db } from '@church/db'
import {
  attendanceCheckins,
  duplicateCandidates,
  engagementRiskFlags,
  familyRelationships,
  importJobs,
  importRows,
  memberZones,
  members,
  mergeActions,
} from '@church/db'

type ImportMode = 'create_only' | 'update_only' | 'create_and_update'

function parseCsv(content: string): string[][] {
  return content
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => line.split(',').map((v) => v.trim()))
}

@Injectable()
export class DataQualityService {
  async previewImport(churchId: string, userId: string, input: {
    fileName: string
    format: 'csv' | 'xlsx'
    content: string
    columnMapping: Record<string, string>
    mode: ImportMode
  }) {
    const rows = parseCsv(input.content)
    if (rows.length < 2) throw new BadRequestException('No data rows found in upload')

    const header = rows[0]
    const dataRows = rows.slice(1)

    const [job] = await db.insert(importJobs).values({
      churchId,
      createdBy: userId,
      fileName: input.fileName,
      fileFormat: input.format,
      columnMapping: JSON.stringify(input.columnMapping || {}),
      mode: input.mode,
      status: 'previewed',
      totalRows: dataRows.length,
    }).returning()

    let validRows = 0
    let invalidRows = 0

    const rowWrites: Array<typeof importRows.$inferInsert> = []
    for (let i = 0; i < dataRows.length; i++) {
      const record: Record<string, string> = {}
      for (let c = 0; c < header.length; c++) {
        record[header[c]] = dataRows[i][c] || ''
      }

      const mapped = {
        firstName: record[input.columnMapping.firstName || 'firstName'] || '',
        lastName: record[input.columnMapping.lastName || 'lastName'] || '',
        phone: record[input.columnMapping.phone || 'phone'] || '',
        gender: (record[input.columnMapping.gender || 'gender'] || '').toLowerCase(),
        maritalStatus: (record[input.columnMapping.maritalStatus || 'maritalStatus'] || '').toLowerCase(),
      }

      const errors: string[] = []
      if (!mapped.firstName) errors.push('firstName is required')
      if (!mapped.lastName) errors.push('lastName is required')
      if (mapped.gender && !['male', 'female', 'others'].includes(mapped.gender)) errors.push('invalid gender value')
      if (mapped.maritalStatus && !['single', 'married', 'divorced', 'widowed'].includes(mapped.maritalStatus)) errors.push('invalid maritalStatus value')

      const isValid = errors.length === 0
      if (isValid) validRows += 1
      else invalidRows += 1

      rowWrites.push({
        importJobId: job.id,
        churchId,
        rowNumber: i + 2,
        rawData: JSON.stringify(record),
        normalizedData: JSON.stringify(mapped),
        isValid,
        errors: JSON.stringify(errors),
      })
    }

    if (rowWrites.length > 0) {
      await db.insert(importRows).values(rowWrites)
    }

    await db.update(importJobs).set({ validRows, invalidRows, updatedAt: new Date() }).where(eq(importJobs.id, job.id))

    return { ...job, validRows, invalidRows }
  }

  async commitImport(churchId: string, userId: string, importJobId: string, mode: ImportMode, idempotencyKey: string) {
    const [job] = await db.query.importJobs.findMany({ where: and(eq(importJobs.id, importJobId), eq(importJobs.churchId, churchId)) })
    if (!job) throw new NotFoundException('Import job not found')

    if (job.status === 'committed' && job.idempotencyKey === idempotencyKey) {
      return job
    }

    const rows = await db.query.importRows.findMany({ where: and(eq(importRows.importJobId, importJobId), eq(importRows.isValid, true)) })

    let createdCount = 0
    let updatedCount = 0
    let skippedCount = 0

    for (const row of rows) {
      const normalized = JSON.parse(row.normalizedData || '{}')
      const existingByPhone = normalized.phone
        ? await db.query.members.findFirst({ where: and(eq(members.churchId, churchId), eq(members.phone, normalized.phone), isNull(members.deletedAt)) })
        : null

      if (!existingByPhone && mode === 'update_only') {
        skippedCount += 1
        await db.update(importRows).set({ actionTaken: 'skipped' }).where(eq(importRows.id, row.id))
        continue
      }

      if (existingByPhone && mode === 'create_only') {
        skippedCount += 1
        await db.update(importRows).set({ actionTaken: 'skipped', targetMemberId: existingByPhone.id }).where(eq(importRows.id, row.id))
        continue
      }

      if (existingByPhone) {
        const [updated] = await db.update(members).set({
          firstName: normalized.firstName || existingByPhone.firstName,
          lastName: normalized.lastName || existingByPhone.lastName,
          phone: normalized.phone || existingByPhone.phone,
          gender: normalized.gender || existingByPhone.gender,
          maritalStatus: normalized.maritalStatus || existingByPhone.maritalStatus,
          updatedAt: new Date() as any,
        }).where(eq(members.id, existingByPhone.id)).returning()
        updatedCount += 1
        await db.update(importRows).set({ actionTaken: 'updated', targetMemberId: updated.id }).where(eq(importRows.id, row.id))
      } else {
        const [created] = await db.insert(members).values({
          churchId,
          firstName: normalized.firstName,
          lastName: normalized.lastName,
          phone: normalized.phone || null,
          gender: normalized.gender || null,
          maritalStatus: normalized.maritalStatus || null,
        }).returning()
        createdCount += 1
        await db.update(importRows).set({ actionTaken: 'created', targetMemberId: created.id }).where(eq(importRows.id, row.id))
      }
    }

    const [updatedJob] = await db.update(importJobs).set({
      status: 'committed',
      mode,
      idempotencyKey,
      createdCount,
      updatedCount,
      skippedCount,
      summary: JSON.stringify({ createdCount, updatedCount, skippedCount }),
      updatedAt: new Date(),
    }).where(eq(importJobs.id, importJobId)).returning()

    return updatedJob
  }

  async listImportJobs(churchId: string) {
    return db.query.importJobs.findMany({ where: eq(importJobs.churchId, churchId), orderBy: (t, { desc }) => [desc(t.createdAt)] })
  }

  async getImportJobDetail(churchId: string, importJobId: string) {
    const [job] = await db.query.importJobs.findMany({ where: and(eq(importJobs.id, importJobId), eq(importJobs.churchId, churchId)) })
    if (!job) throw new NotFoundException('Import job not found')
    const rows = await db.query.importRows.findMany({ where: eq(importRows.importJobId, importJobId), orderBy: (t, { asc }) => [asc(t.rowNumber)] })
    return { job, rows }
  }

  async refreshDuplicateCandidates(churchId: string, userId: string) {
    const memberRows = await db.query.members.findMany({ where: and(eq(members.churchId, churchId), isNull(members.deletedAt)) })

    const writes: Array<typeof duplicateCandidates.$inferInsert> = []

    for (let i = 0; i < memberRows.length; i++) {
      for (let j = i + 1; j < memberRows.length; j++) {
        const a = memberRows[i]
        const b = memberRows[j]
        if (a.id === b.id) continue

        let confidence = 0
        let reason = ''

        if (a.phone && b.phone && a.phone === b.phone) {
          confidence = 95
          reason = 'Exact phone match'
        } else if (
          a.lastName?.toLowerCase() === b.lastName?.toLowerCase() &&
          a.firstName?.slice(0, 2).toLowerCase() === b.firstName?.slice(0, 2).toLowerCase()
        ) {
          confidence = 70
          reason = 'Name similarity in same church'
        }

        if (confidence === 0) continue

        const existing = await db.query.duplicateCandidates.findFirst({
          where: and(
            eq(duplicateCandidates.churchId, churchId),
            eq(duplicateCandidates.primaryMemberId, a.id),
            eq(duplicateCandidates.duplicateMemberId, b.id),
          ),
        })

        if (existing && existing.status === 'declined') continue
        if (existing) continue

        writes.push({
          churchId,
          primaryMemberId: a.id,
          duplicateMemberId: b.id,
          confidenceScore: confidence,
          reason,
          createdBy: userId,
        })
      }
    }

    if (writes.length > 0) await db.insert(duplicateCandidates).values(writes)
    return this.listDuplicateCandidates(churchId)
  }

  async listDuplicateCandidates(churchId: string) {
    return db.query.duplicateCandidates.findMany({
      where: and(eq(duplicateCandidates.churchId, churchId), eq(duplicateCandidates.status, 'pending')),
      orderBy: (t, { desc }) => [desc(t.confidenceScore), desc(t.createdAt)],
    })
  }

  async resolveDuplicateCandidate(churchId: string, userId: string, candidateId: string, decision: 'approve' | 'decline' | 'ignore') {
    const [candidate] = await db.query.duplicateCandidates.findMany({ where: and(eq(duplicateCandidates.id, candidateId), eq(duplicateCandidates.churchId, churchId)) })
    if (!candidate) throw new NotFoundException('Duplicate candidate not found')

    const nextStatus = decision === 'approve' ? 'approved' : decision === 'decline' ? 'declined' : 'ignored'
    await db.update(duplicateCandidates).set({ status: nextStatus, resolvedBy: userId, resolvedAt: new Date() }).where(eq(duplicateCandidates.id, candidate.id))

    if (decision !== 'approve') return { success: true, status: nextStatus }

    const sourceId = candidate.duplicateMemberId
    const targetId = candidate.primaryMemberId

    const memberZoneRelink = await db.update(memberZones).set({ memberId: targetId }).where(eq(memberZones.memberId, sourceId)).returning()
    const checkinRelink = await db.update(attendanceCheckins).set({ memberId: targetId }).where(eq(attendanceCheckins.memberId, sourceId)).returning()
    const riskRelink = await db.update(engagementRiskFlags).set({ memberId: targetId }).where(eq(engagementRiskFlags.memberId, sourceId)).returning()
    const familyRelink = await db.update(familyRelationships).set({ memberId: targetId, updatedAt: new Date() }).where(eq(familyRelationships.memberId, sourceId)).returning()

    await db.update(members).set({ deletedAt: new Date() as any, updatedAt: new Date() as any }).where(eq(members.id, sourceId))

    await db.insert(mergeActions).values({
      churchId,
      candidateId: candidate.id,
      sourceMemberId: sourceId,
      targetMemberId: targetId,
      mergedBy: userId,
      relinkSummary: JSON.stringify({
        memberZones: memberZoneRelink.length,
        attendanceCheckins: checkinRelink.length,
        engagementRiskFlags: riskRelink.length,
        familyRelationships: familyRelink.length,
      }),
    })

    return { success: true, status: 'approved' }
  }
}
