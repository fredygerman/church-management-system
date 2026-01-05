'use server'

import { getSession } from '@/auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Function to get all families for a church
export async function getFamilies(churchId: string): Promise<any[]> {
  const session = await getSession()
  if (!session?.accessToken) {
    throw new Error('Unauthorized')
  }

  try {
    const response = await fetch(`${API_BASE_URL}/families?churchId=${churchId}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch families')
    }

    return response.json()
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
  const session = await getSession()
  if (!session?.accessToken) {
    throw new Error('Unauthorized')
  }

  const response = await fetch(`${API_BASE_URL}/families`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create family')
  }

  return response.json()
}
