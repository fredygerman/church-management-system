'use server'

import { apiGet, apiPatch, apiPost, apiPut } from '@/lib/api-helpers'

export async function getTemplates(churchId: string, channel?: 'sms' | 'email') {
  return apiGet('/communications/templates', { churchId, channel })
}

export async function createTemplate(input: { churchId: string; name: string; channel: 'sms' | 'email'; subject?: string; body: string; isActive?: boolean }) {
  return apiPost('/communications/templates', input)
}

export async function updateTemplate(input: { churchId: string; id: string; name?: string; subject?: string; body?: string; isActive?: boolean }) {
  return apiPatch(`/communications/templates/${input.id}`, input)
}

export async function previewTemplate(input: { churchId: string; subject?: string; body: string; variables?: Record<string, string> }) {
  return apiPost('/communications/templates/preview', input)
}

export async function getCampaigns(churchId: string, filters?: { status?: string; channel?: string; from?: string; to?: string }) {
  return apiGet('/communications/campaigns', { churchId, ...(filters || {}) })
}

export async function getCampaign(churchId: string, id: string) {
  return apiGet(`/communications/campaigns/${id}`, { churchId })
}

export async function createCampaign(input: {
  churchId: string
  name: string
  channel: 'sms' | 'email'
  templateId?: string
  subject?: string
  body?: string
  audienceFilters?: Record<string, any>
  scheduledAt?: string
}) {
  return apiPost('/communications/campaigns', input)
}

export async function updateCampaign(input: {
  churchId: string
  id: string
  name?: string
  subject?: string
  body?: string
  audienceFilters?: Record<string, any>
  scheduledAt?: string | null
}) {
  return apiPut(`/communications/campaigns/${input.id}`, input)
}

export async function scheduleCampaign(input: { churchId: string; id: string; scheduledAt: string }) {
  return apiPost(`/communications/campaigns/${input.id}/schedule`, input)
}

export async function sendCampaignNow(input: { churchId: string; id: string }) {
  return apiPost(`/communications/campaigns/${input.id}/send`, input)
}

export async function cancelCampaign(input: { churchId: string; id: string }) {
  return apiPost(`/communications/campaigns/${input.id}/cancel`, input)
}
