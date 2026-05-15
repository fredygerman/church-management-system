'use server'

import { apiGet, apiPost } from '@/lib/api-helpers'

// Function to get all families for a church
export async function getFamilies(churchId: string): Promise<any[]> {
  try {
    const result = await apiGet('/families', { churchId })
    return Array.isArray(result) ? result : []
  } catch (error) {
    console.error('Error fetching families:', error)
    return []
  }
}

// Function to create a new family
export async function createFamily(data: {
  churchId: string
  familyName: string
  address?: string
  phone?: string
}): Promise<any> {
  return apiPost('/families', data)
}
