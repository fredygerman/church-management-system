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

    return response.json()
  } catch (error) {
    console.error('Error fetching visitors:', error)
    return []
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
  status: 'pending' | 'completed' | 'no-show'
}): Promise<any> {
  const session = await getSession()
  if (!session?.accessToken) {
    throw new Error('Unauthorized')
  }

  const response = await fetch(`${API_BASE_URL}/visitors/${data.visitorId}/followups`, {
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
