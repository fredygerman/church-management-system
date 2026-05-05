'use server'

import { apiGet, apiPost } from '@/lib/api-helpers'

export async function previewImport(input: { churchId: string; fileName: string; format: 'csv' | 'xlsx'; content: string; columnMapping: Record<string, string>; mode: 'create_only' | 'update_only' | 'create_and_update' }) {
  return apiPost('/data-quality/imports/preview', input)
}

export async function commitImport(input: { churchId: string; importJobId: string; mode: 'create_only' | 'update_only' | 'create_and_update'; idempotencyKey: string }) {
  return apiPost(`/data-quality/imports/${input.importJobId}/commit`, input)
}

export async function listImportJobs(churchId: string) {
  return apiGet('/data-quality/imports', { churchId })
}

export async function getImportJob(churchId: string, importJobId: string) {
  return apiGet(`/data-quality/imports/${importJobId}`, { churchId })
}

export async function refreshDuplicates(churchId: string) {
  return apiPost('/data-quality/duplicates/refresh', { churchId })
}

export async function listDuplicates(churchId: string) {
  return apiGet('/data-quality/duplicates', { churchId })
}

export async function resolveDuplicate(input: { churchId: string; candidateId: string; decision: 'approve' | 'decline' | 'ignore' }) {
  return apiPost(`/data-quality/duplicates/${input.candidateId}/resolve`, input)
}
