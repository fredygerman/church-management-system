"use server"

import { isValid, parseISO } from "date-fns"
import { type MemberFormData } from "@/types/member"
import { apiPost, apiGet, apiPut, apiDelete } from "@/lib/api-helpers"

function isValidDate(dateStr: string): boolean {
  try {
    return isValid(parseISO(dateStr))
  } catch {
    return false
  }
}

// Function to create a new member
export async function createMember(
  data: MemberFormData & { churchId: string }
): Promise<{ success: boolean; member: any }> {
  // Validate required dates
  if (
    !data.personalInfo.birthDate ||
    !isValidDate(data.personalInfo.birthDate)
  ) {
    throw new Error("Birth date is required and must be a valid date")
  }
  if (!data.churchInfo.joinedDate || !isValidDate(data.churchInfo.joinedDate)) {
    throw new Error("Joined date is required and must be a valid date")
  }

  // Validate optional dates if provided
  if (
    data.churchInfo.salvationDate &&
    !isValidDate(data.churchInfo.salvationDate)
  ) {
    throw new Error("Salvation date must be a valid date")
  }
  if (
    data.churchInfo.baptismDate &&
    !isValidDate(data.churchInfo.baptismDate)
  ) {
    throw new Error("Baptism date must be a valid date")
  }
  if (
    data.churchInfo.anointedDate &&
    !isValidDate(data.churchInfo.anointedDate)
  ) {
    throw new Error("Anointed date must be a valid date")
  }

  try {
    // Map form fields to API fields
    const mappedData = {
      churchId: data.churchId,
      firstName: data.personalInfo.firstName,
      lastName: data.personalInfo.lastName,
      dateOfBirth: data.personalInfo.birthDate,
      gender: data.personalInfo.gender.toLowerCase(),
      maritalStatus: data.personalInfo.maritalStatus.toLowerCase(),
      phone: data.contactInfo?.phone,
      occupation: data.personalInfo.occupation,
      dateOfSalvation: data.churchInfo.salvationDate || undefined,
      notes: data.personalInfo.tribe || undefined,
    }

    const member = await apiPost('/members', mappedData)
    
    return {
      success: true,
      member,
    }
  } catch (error) {
    console.error('Error creating member:', error)
    throw error
  }
}

// Function to get all members for a church with pagination and filters
export async function getMembers(
  queryParams: {
    page: number
    per_page: number
    sort: string
    firstName: string
    lastName: string
    gender: string
    maritalStatus: string
    occupation: string
    from: string
    to: string
  },
  churchId: string
): Promise<{ members: any[]; pageCount: number }> {
  try {
    // Build query string
    const params = new URLSearchParams({
      churchId,
      page: queryParams.page.toString(),
      per_page: queryParams.per_page.toString(),
      sort: queryParams.sort,
      ...(queryParams.firstName && { firstName: queryParams.firstName }),
      ...(queryParams.lastName && { lastName: queryParams.lastName }),
      ...(queryParams.gender && { gender: queryParams.gender }),
      ...(queryParams.maritalStatus && { maritalStatus: queryParams.maritalStatus }),
      ...(queryParams.occupation && { occupation: queryParams.occupation }),
      ...(queryParams.from && { from: queryParams.from }),
      ...(queryParams.to && { to: queryParams.to }),
    })

    const result = await apiGet(`/members?${params}`)
    const pageCount = result?.meta?.total_pages || 1
    
    return { 
      members: result || [], 
      pageCount 
    }
  } catch (error) {
    console.error('Error fetching members:', error)
    // Re-throw Next.js control flow errors (redirect, notFound, etc)
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }
    return { members: [], pageCount: 0 }
  }
}

// Function to get a single member by ID
export async function getMemberById(churchId: string, id: string): Promise<any> {
  try {
    return await apiGet(`/members/${id}`, { churchId })
  } catch (error) {
    console.error('Error fetching member:', error)
    throw error
  }
}

// Function to get zones for a member
export async function getMemberZones(churchId: string, memberId: string): Promise<any[]> {
  try {
    const data = await apiGet(`/members/${memberId}/zones`, { churchId })
    
    // Map the response to extract zone info
    if (Array.isArray(data)) {
      return data.map((memberZone: any) => ({
        id: memberZone.zone?.id,
        name: memberZone.zone?.name,
        isLeader: memberZone.isLeader,
      }))
    }
    
    return []
  } catch (error) {
    console.error('Error fetching member zones:', error)
    return []
  }
}

// Function to update a member
export async function updateMember(
  churchId: string,
  id: string,
  data: {
    firstName?: string
    lastName?: string
    dateOfBirth?: string
    gender?: "male" | "female" | "others"
    maritalStatus?: "single" | "married" | "divorced" | "widowed"
  }
): Promise<any> {
  try {
    return await apiPut(`/members/${id}`, { ...data, churchId })
  } catch (error) {
    console.error('Error updating member:', error)
    throw error
  }
}

// Function to delete a member
export async function deleteMember(churchId: string, id: string): Promise<void> {
  try {
    await apiDelete(`/members/${id}`, { churchId })
  } catch (error) {
    console.error('Error deleting member:', error)
    throw error
  }
}

// Function to search members by name or phone
export async function searchMembers(
  churchId: string,
  query: string
): Promise<any[]> {
  try {
    if (!query.trim()) {
      return []
    }
    
    const params = new URLSearchParams({
      q: query,
    })
    
    const result = await apiGet(`/members/search?${params}`)
    return Array.isArray(result) ? result : []
  } catch (error) {
    console.error('Error searching members:', error)
    return []
  }
}
