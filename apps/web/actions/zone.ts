'use server'

import { revalidatePath } from 'next/cache'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-helpers'

// Function to get all zones for a church
export async function getZones(churchId: string): Promise<any[]> {
  try {
    const result = await apiGet('/zones', { churchId })
    return Array.isArray(result) ? result : []
  } catch (error) {
    // Re-throw Next.js control flow errors (redirect, notFound, etc)
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }
    console.error('Error fetching zones:', error)
    return []
  }
}

// Function to get a single zone by ID
export async function getZoneById(churchId: string, zoneId: string): Promise<any> {
  try {
    return await apiGet(`/zones/${zoneId}`, { churchId })
  } catch (error) {
    console.error('Error fetching zone:', error)
    throw error
  }
}

// Function to get members of a zone
export async function getZoneMembers(
  churchId: string,
  zoneId: string,
  queryParams?: {
    page?: number
    per_page?: number
    sort?: string
  }
): Promise<{ members: any[]; pageCount: number }> {
  try {
    const result = await apiGet(`/zones/${zoneId}/members`, {
      churchId,
      page: (queryParams?.page ?? 1).toString(),
      per_page: (queryParams?.per_page ?? 10).toString(),
      sort: queryParams?.sort ?? 'firstName.asc',
    })
    const pageCount = result?.meta?.total_pages || 1
    
    return { 
      members: result || [], 
      pageCount 
    }
  } catch (error) {
    console.error('Error fetching zone members:', error)
    return { members: [], pageCount: 0 }
  }
}

// Function to create a new zone
export async function createZone(data: {
  churchId: string
  name: string
  leader?: string
  description?: string
  meetingDay?: string
}): Promise<any> {
  try {
    const zone = await apiPost('/zones', data)

    // Add explicit leader membership when a leader is provided
    if (data.leader) {
      try {
        await apiPost(`/zones/${zone.id}/members`, {
          churchId: data.churchId,
          memberId: data.leader,
          isLeader: true,
        })
      } catch (error) {
        console.error('Error assigning initial leader to zone:', error)
      }
    }

    // Revalidate zones list page
    revalidatePath(`/${data.churchId}/dashboard/zones`)
    
    return zone
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
}, churchId: string): Promise<any> {
  try {
    const result = await apiPut(`/zones/${zoneId}`, { ...data, churchId })
    
    // Revalidate zone detail page if churchId is provided
    if (churchId) {
      revalidatePath(`/${churchId}/dashboard/zones/${zoneId}`)
      revalidatePath(`/${churchId}/dashboard/zones`)
    }
    
    return result
  } catch (error) {
    console.error('Error updating zone:', error)
    throw error
  }
}

// Function to delete a zone
export async function deleteZone(zoneId: string, churchId: string): Promise<void> {
  try {
    await apiDelete(`/zones/${zoneId}`, { churchId })
    
    // Revalidate zones list page if churchId is provided
    if (churchId) {
      revalidatePath(`/${churchId}/dashboard/zones`)
    }
  } catch (error) {
    console.error('Error deleting zone:', error)
    throw error
  }
}

// Function to get zone leader details
export async function getZoneLeader(churchId: string, leaderId: string): Promise<any> {
  try {
    return await apiGet(`/members/${leaderId}`, { churchId })
  } catch (error) {
    console.error('Error fetching zone leader:', error)
    return null
  }
}

// Function to assign a member to a zone
export async function assignMemberToZone(
  zoneId: string,
  memberId: string,
  isLeader: boolean = false,
  churchId: string
): Promise<any> {
  try {
    const result = await apiPost(`/zones/${zoneId}/members`, {
      memberId,
      isLeader,
      churchId,
    })
    
    // Revalidate zone detail page if churchId is provided
    if (churchId) {
      revalidatePath(`/${churchId}/dashboard/zones/${zoneId}`)
    }
    
    return result
  } catch (error) {
    console.error('Error assigning member to zone:', error)
    throw error
  }
}

// Function to unassign a member from a zone
export async function unassignMemberFromZone(
  zoneId: string,
  memberId: string,
  churchId: string,
  newLeaderId?: string,
): Promise<void> {
  try {
    // If member is a leader, check if there's a replacement
    const zone = await getZoneById(churchId, zoneId)
    if (zone.leaderId === memberId && !newLeaderId) {
      throw new Error('Cannot remove the zone leader without assigning a replacement leader')
    }

    // If assigning a new leader, update zone
    if (newLeaderId && zone.leaderId === memberId) {
      await updateZone(zoneId, { leader: newLeaderId }, churchId)
    }

    // Remove member from zone
    await apiDelete(`/zones/${zoneId}/members/${memberId}`, { churchId })
    
    // Revalidate zone detail page if churchId is provided
    if (churchId) {
      revalidatePath(`/${churchId}/dashboard/zones/${zoneId}`)
    }
  } catch (error) {
    console.error('Error unassigning member from zone:', error)
    throw error
  }
}

// Function to get zone statistics
export async function getZoneStats(churchId: string, zoneId: string): Promise<any> {
  try {
    return await apiGet(`/zones/${zoneId}/stats`, { churchId })
  } catch (error) {
    console.error('Error fetching zone stats:', error)
    return { totalMembers: 0, leaders: 0, regularMembers: 0 }
  }
}
