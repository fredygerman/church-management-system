'use server'

import { getSession } from '@/auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Function to get all zones for a church
export async function getZones(churchId?: string): Promise<any[]> {
  const session = await getSession()
  if (!session?.accessToken) {
    throw new Error('Unauthorized')
  }

  try {
    const url = churchId 
      ? `${API_BASE_URL}/zones?churchId=${churchId}`
      : `${API_BASE_URL}/zones`
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch zones')
    }

    return response.json()
  } catch (error) {
    console.error('Error fetching zones:', error)
    // Fallback to empty array if API is not available
    return []
  }
}
