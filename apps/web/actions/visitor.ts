'use server'

import { apiGet, apiPost } from '@/lib/api-helpers'

// Function to get all visitors for a church
export async function getVisitors(churchId: string): Promise<any[]> {
  try {
    const result = await apiGet('/visitors', { churchId })
    return Array.isArray(result) ? result : []
  } catch (error) {
    console.error('Error fetching visitors:', error)
    return []
  }
}

// Function to get a single visitor by ID
export async function getVisitorById(churchId: string, visitorId: string): Promise<any> {
  try {
    return await apiGet(`/visitors/${visitorId}`, { churchId })
  } catch (error) {
    console.error('Error fetching visitor:', error)
    throw error
  }
}

// Function to create a new visitor
export async function createVisitor(data: {
  churchId: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  visitDate?: string
  visitorSource?: string
}): Promise<any> {
  return apiPost('/visitors', data)
}

// Function to create a followup for a visitor
export async function createVisitorFollowup(data: {
  churchId: string
  visitorId: string
  followupDate: string
  notes?: string
  status: 'none' | 'called' | 'visited' | 'converted' | 'dropped'
}): Promise<any> {
  return apiPost(`/visitors/${data.visitorId}/followup`, data)
}

// Convert visitor to member (soft-deletes visitor on backend)
export async function convertVisitorToMember(data: {
  churchId: string
  visitorId: string
  zoneId?: string
}): Promise<any> {
  return apiPost(`/visitors/${data.visitorId}/convert`, {
    churchId: data.churchId,
    zoneId: data.zoneId,
  })
}
