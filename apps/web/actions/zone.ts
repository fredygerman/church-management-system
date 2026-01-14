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

    const result = await response.json()
    // API returns { success, data, message, meta, ... }
    if (result.success && Array.isArray(result.data)) {
      return result.data
    }
    return []
  } catch (error) {
    console.error('Error fetching zones:', error)
    // Fallback to empty array if API is not available
    return []
  }
}

// Function to get a single zone by ID
export async function getZoneById(zoneId: string): Promise<any> {
  const session = await getSession()
  if (!session?.accessToken) {
    throw new Error('Unauthorized')
  }

  try {
    const response = await fetch(`${API_BASE_URL}/zones/${zoneId}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch zone')
    }

    const result = await response.json()
    // API returns { success, data, message, ... }
    if (result.success && result.data) {
      return result.data
    }
    throw new Error(result.message || 'Failed to fetch zone')
  } catch (error) {
    console.error('Error fetching zone:', error)
    throw error
  }
}

// Function to create a new zone
export async function createZone(data: {
  churchId: string
  name: string
  leader?: string
  description?: string
}): Promise<any> {
  const session = await getSession()
  if (!session?.accessToken) {
    throw new Error('Unauthorized')
  }

  try {
    const response = await fetch(`${API_BASE_URL}/zones`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.message || 'Failed to create zone')
    }

    const result = await response.json()
    // API returns { success, data, message, ... }
    if (result.success && result.data) {
      return result.data
    }
    throw new Error(result.message || 'Failed to create zone')
  } catch (error) {
    console.error('Error creating zone:', error)
    throw error
  }
}

// Function to update a zone
export async function updateZone(zoneId: string, data: {
  name?: string
  leader?: string
  description?: string
}): Promise<any> {
  const session = await getSession()
  if (!session?.accessToken) {
    throw new Error('Unauthorized')
  }

  try {
    const response = await fetch(`${API_BASE_URL}/zones/${zoneId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.message || 'Failed to update zone')
    }

    const result = await response.json()
    // API returns { success, data, message, ... }
    if (result.success && result.data) {
      return result.data
    }
    throw new Error(result.message || 'Failed to update zone')
  } catch (error) {
    console.error('Error updating zone:', error)
    throw error
  }
}

// Function to delete a zone
export async function deleteZone(zoneId: string): Promise<void> {
  const session = await getSession()
  if (!session?.accessToken) {
    throw new Error('Unauthorized')
  }

  try {
    const response = await fetch(`${API_BASE_URL}/zones/${zoneId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    })

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.message || 'Failed to delete zone')
    }
  } catch (error) {
    console.error('Error deleting zone:', error)
    throw error
  }
}
