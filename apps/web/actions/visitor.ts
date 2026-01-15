'use server'

import { getSession } from '@/auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Function to get all visitors for a church
export async function getVisitors(churchId: string): Promise<any[]> {
  const session = await getSession()
  if (!session?.accessToken) {
    throw new Error('Unauthorized')
  }

  try {
    const response = await fetch(`${API_BASE_URL}/visitors?churchId=${churchId}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch visitors')
    }

    const result = await response.json()
    
    // Handle wrapped response format { data: [...] }
    if (result.data && Array.isArray(result.data)) {
      return result.data
    }
    
    // Handle plain array response
    if (Array.isArray(result)) {
      return result
    }
    
    console.warn('Visitors API did not return expected format:', result)
    return []
  } catch (error) {
    console.error('Error fetching visitors:', error)
    return []
  }
}

// Function to get a single visitor by ID
export async function getVisitorById(visitorId: string): Promise<any> {
  const session = await getSession()
  if (!session?.accessToken) {
    throw new Error('Unauthorized')
  }

  try {
    const response = await fetch(`${API_BASE_URL}/visitors/${visitorId}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch visitor')
    }

    const result = await response.json()
    
    // Handle wrapped response format { data: {...} }
    if (result.data) {
      return result.data
    }
    
    return result
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
  const session = await getSession()
  if (!session?.accessToken) {
    throw new Error('Unauthorized')
  }

  const response = await fetch(`${API_BASE_URL}/visitors`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create visitor')
  }

  return response.json()
}

// Function to create a followup for a visitor
export async function createVisitorFollowup(data: {
  visitorId: string
  followupDate: string
  notes?: string
  status: 'none' | 'called' | 'visited' | 'converted' | 'dropped'
}): Promise<any> {
  const session = await getSession()
  if (!session?.accessToken) {
    throw new Error('Unauthorized')
  }

  const response = await fetch(`${API_BASE_URL}/visitors/${data.visitorId}/followup`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create followup')
  }

  return response.json()
}

// Convert visitor to member (soft-deletes visitor on backend)
export async function convertVisitorToMember(data: {
  visitorId: string
  zoneId?: string
}): Promise<any> {
  const session = await getSession()
  if (!session?.accessToken) {
    throw new Error('Unauthorized')
  }

  const response = await fetch(`${API_BASE_URL}/visitors/${data.visitorId}/convert`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ zoneId: data.zoneId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to convert visitor')
  }

  return response.json()
}
