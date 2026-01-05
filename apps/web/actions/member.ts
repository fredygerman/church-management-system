"use server"

import { getSession } from "@/auth"
import { isValid, parseISO } from "date-fns"
import { type MemberFormData } from "@/types/member"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

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
  const session = await getSession()
  if (!session?.accessToken) {
    throw new Error('Unauthorized')
  }

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
    const response = await fetch(`${API_BASE_URL}/members`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data.personalInfo,
        ...data.churchInfo,
        churchId: data.churchId,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create member')
    }

    const member = await response.json()
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
    fullName: string
    gender: string
    maritalStatus: string
    occupation: string
    from: string
    to: string
  },
  churchId: string
): Promise<{ members: any[]; pageCount: number }> {
  const session = await getSession()
  if (!session?.accessToken) {
    throw new Error('Unauthorized')
  }

  try {
    // Build query string
    const queryString = new URLSearchParams({
      churchId,
      page: queryParams.page.toString(),
      per_page: queryParams.per_page.toString(),
      sort: queryParams.sort,
      ...(queryParams.fullName && { fullName: queryParams.fullName }),
      ...(queryParams.gender && { gender: queryParams.gender }),
      ...(queryParams.maritalStatus && { maritalStatus: queryParams.maritalStatus }),
      ...(queryParams.occupation && { occupation: queryParams.occupation }),
      ...(queryParams.from && { from: queryParams.from }),
      ...(queryParams.to && { to: queryParams.to }),
    })

    const response = await fetch(`${API_BASE_URL}/members?${queryString}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch members')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching members:', error)
    return { members: [], pageCount: 0 }
  }
}

// Function to get a single member by ID
export async function getMemberById(id: string): Promise<any> {
  const session = await getSession()
  if (!session?.accessToken) {
    throw new Error('Unauthorized')
  }

  try {
    const response = await fetch(`${API_BASE_URL}/members/${id}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch member')
    }

    return response.json()
  } catch (error) {
    console.error('Error fetching member:', error)
    throw error
  }
}

// Function to update a member
export async function updateMember(
  id: string,
  data: {
    firstName?: string
    lastName?: string
    dateOfBirth?: string
    gender?: "male" | "female" | "others"
    maritalStatus?: "single" | "married" | "divorced" | "widowed"
  }
) {
  const session = await getSession()
  if (!session?.accessToken) {
    throw new Error('Unauthorized')
  }

  const response = await fetch(`${API_BASE_URL}/members/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update member')
  }

  return response.json()
}

// Function to delete a member
export async function deleteMember(id: string) {
  const session = await getSession()
  if (!session?.accessToken) {
    throw new Error('Unauthorized')
  }

  const response = await fetch(`${API_BASE_URL}/members/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to delete member')
  }
}
