'use server'

import { apiDelete, apiGet, apiPost } from '@/lib/api-helpers'

export async function createFamilyRelationship(input: { churchId: string; familyId: string; memberId: string; role: 'head' | 'spouse' | 'child' | 'guardian' | 'other'; status?: 'pending' | 'confirmed' }) {
  return apiPost('/family-lifecycle/relationships', input)
}

export async function removeFamilyRelationship(churchId: string, relationshipId: string) {
  return apiDelete(`/family-lifecycle/relationships/${relationshipId}`)
}

export async function listFamilyRelationships(churchId: string, familyId?: string) {
  return apiGet('/family-lifecycle/relationships', { churchId, familyId })
}

export async function createLifecycleRule(input: { churchId: string; milestoneType: 'birthday' | 'anniversary' | 'baptism' | 'custom'; customMilestoneName?: string; channel: 'sms' | 'email'; notifyTarget: 'member' | 'family_head' | 'leader' | 'admin'; leadDays: string; isActive?: boolean }) {
  return apiPost('/family-lifecycle/rules', input)
}

export async function listLifecycleRules(churchId: string) {
  return apiGet('/family-lifecycle/rules', { churchId })
}

export async function createLifecycleMilestone(input: { churchId: string; memberId: string; familyId?: string; milestoneType: 'birthday' | 'anniversary' | 'baptism' | 'custom'; label: string; milestoneDate: string; notificationRuleId?: string; details?: string }) {
  return apiPost('/family-lifecycle/milestones', input)
}

export async function listLifecycleMilestones(churchId: string, from?: string, to?: string) {
  return apiGet('/family-lifecycle/milestones', { churchId, from, to })
}

export async function listFamilySuggestions(churchId: string) {
  return apiGet('/family-lifecycle/suggestions', { churchId })
}

export async function resolveFamilySuggestion(input: { churchId: string; suggestionId: string; decision: 'approved' | 'declined' | 'ignored' }) {
  return apiPost(`/family-lifecycle/suggestions/${input.suggestionId}/resolve`, input)
}

export async function getFamilyLifecycleDashboard(churchId: string) {
  return apiGet('/family-lifecycle/dashboard', { churchId })
}
