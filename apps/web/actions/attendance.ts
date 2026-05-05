'use server'

import { apiGet, apiPatch, apiPost, apiPut } from '@/lib/api-helpers'

export async function getServiceTypes(churchId: string) {
  return apiGet('/attendance/service-types', { churchId })
}

export async function createServiceType(input: { churchId: string; name: string; isActive?: boolean }) {
  return apiPost('/attendance/service-types', input)
}

export async function updateServiceType(input: { churchId: string; id: string; name?: string; isActive?: boolean }) {
  return apiPatch(`/attendance/service-types/${input.id}`, input)
}

export async function getServiceSessions(churchId: string, from?: string, to?: string) {
  return apiGet('/attendance/sessions', { churchId, from, to })
}

export async function createServiceSession(input: { churchId: string; serviceTypeId: string; title?: string; sessionDate: string }) {
  return apiPost('/attendance/sessions', input)
}

export async function updateServiceSessionStatus(input: { churchId: string; id: string; status: 'draft' | 'open' | 'closed' }) {
  return apiPatch(`/attendance/sessions/${input.id}/status`, input)
}

export async function upsertHeadcount(input: { churchId: string; sessionId: string; menCount: number; womenCount: number; childrenCount: number; visitorsCount: number }) {
  return apiPut(`/attendance/sessions/${input.sessionId}/headcount`, input)
}

export async function manualCheckin(input: { churchId: string; sessionId: string; memberId: string }) {
  return apiPost(`/attendance/sessions/${input.sessionId}/checkins/manual`, input)
}

export async function qrCheckin(input: { churchId: string; token: string; memberId: string }) {
  return apiPost(`/attendance/checkins/qr/${input.token}`, input)
}

export async function getAttendanceTrends(input: { churchId: string; from: string; to: string; groupBy: 'branch' | 'zone' | 'gender' | 'age_band' }) {
  return apiGet('/attendance/trends', input)
}

export async function getRiskSettings(churchId: string) {
  return apiGet('/attendance/risk-settings', { churchId })
}

export async function upsertRiskSettings(input: { churchId: string; consecutiveMissedThreshold: number; isActive: boolean }) {
  return apiPut('/attendance/risk-settings', input)
}

export async function getAtRiskMembers(churchId: string) {
  return apiGet('/attendance/risk-flags', { churchId })
}

export async function upsertAttendanceSessionMetadata(input: { churchId: string; sessionId: string; cadence: 'weekly' | 'biweekly' | 'monthly' | 'special'; tags: string[]; notes?: string }) {
  return apiPut(`/attendance/sessions/${input.sessionId}/metadata`, input)
}

export async function batchManualCheckins(input: { churchId: string; sessionId: string; memberIds: string[] }) {
  return apiPost(`/attendance/sessions/${input.sessionId}/checkins/manual/batch`, input)
}

export async function getAttendanceTrendComparison(input: { churchId: string; from: string; to: string; groupBy: 'branch' | 'zone' | 'gender' | 'age_band' }) {
  return apiGet('/attendance/trends/compare', input)
}

export async function getAttendanceCohorts(input: { churchId: string; from: string; to: string }) {
  return apiGet('/attendance/cohorts', input)
}

export async function getOpenSessionHealth(churchId: string) {
  return apiGet('/attendance/sessions/open/health', { churchId })
}

export async function createRiskProfile(input: { churchId: string; versionLabel: string; missedWeight: number; recencyWeight: number; lowThreshold: number; mediumThreshold: number; highThreshold: number; isActive: number }) {
  return apiPost('/attendance/risk-profiles', input)
}
