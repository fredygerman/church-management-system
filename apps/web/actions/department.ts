'use server'

import { revalidatePath } from 'next/cache'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-helpers'

// Function to get all departments for a church
export async function getDepartments(churchId: string): Promise<any[]> {
  try {
    const result = await apiGet('/departments', { churchId })
    return Array.isArray(result) ? result : []
  } catch (error) {
    // Re-throw Next.js control flow errors (redirect, notFound, etc)
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }
    console.error('Error fetching departments:', error)
    return []
  }
}

// Function to get a single department by ID
export async function getDepartmentById(churchId: string, departmentId: string): Promise<any> {
  try {
    return await apiGet(`/departments/${departmentId}`, { churchId })
  } catch (error) {
    console.error('Error fetching department:', error)
    throw error
  }
}

// Function to get members of a department
export async function getDepartmentMembers(
  churchId: string,
  departmentId: string,
  queryParams?: {
    page?: number
    per_page?: number
    sort?: string
  }
): Promise<{ members: any[]; pageCount: number }> {
  try {
    const result = await apiGet(`/departments/${departmentId}/members`, {
      churchId,
      page: (queryParams?.page ?? 1).toString(),
      per_page: (queryParams?.per_page ?? 10).toString(),
      sort: queryParams?.sort ?? 'firstName.asc',
    })
    // The API returns a plain array, not paginated metadata like zones
    return {
      members: Array.isArray(result) ? result : [],
      pageCount: 1
    }
  } catch (error) {
    console.error('Error fetching department members:', error)
    return { members: [], pageCount: 1 }
  }
}

// Function to create a new department
export async function createDepartment(data: {
  churchId: string
  name: string
  description?: string
  meetingDay?: string
}): Promise<any> {
  try {
    const department = await apiPost('/departments', data)

    // Revalidate departments list page
    revalidatePath(`/${data.churchId}/dashboard/departments`)

    return department
  } catch (error) {
    console.error('Error creating department:', error)
    throw error
  }
}

// Function to update a department
export async function updateDepartment(departmentId: string, data: {
  name?: string
  description?: string
  meetingDay?: string
}, churchId: string): Promise<any> {
  try {
    const result = await apiPut(`/departments/${departmentId}`, { ...data, churchId })

    // Revalidate department detail page and list
    if (churchId) {
      revalidatePath(`/${churchId}/dashboard/departments/${departmentId}`)
      revalidatePath(`/${churchId}/dashboard/departments`)
    }

    return result
  } catch (error) {
    console.error('Error updating department:', error)
    throw error
  }
}

// Function to delete a department
export async function deleteDepartment(departmentId: string, churchId: string): Promise<void> {
  try {
    await apiDelete(`/departments/${departmentId}`, { churchId })

    // Revalidate departments list page
    if (churchId) {
      revalidatePath(`/${churchId}/dashboard/departments`)
    }
  } catch (error) {
    console.error('Error deleting department:', error)
    throw error
  }
}

// Function to assign a member to a department
export async function assignMemberToDepartment(
  departmentId: string,
  memberId: string,
  isLeader: boolean = false,
  churchId: string
): Promise<any> {
  try {
    const result = await apiPost(`/departments/${departmentId}/members`, {
      memberId,
      isLeader,
      churchId,
    })

    // Revalidate department detail page
    if (churchId) {
      revalidatePath(`/${churchId}/dashboard/departments/${departmentId}`)
    }

    return result
  } catch (error) {
    console.error('Error assigning member to department:', error)
    throw error
  }
}

// Function to remove a member from a department
export async function removeMemberFromDepartment(
  departmentId: string,
  memberId: string,
  churchId: string
): Promise<void> {
  try {
    // Simple removal with no leader-reassignment logic (unlike zones)
    await apiDelete(`/departments/${departmentId}/members/${memberId}`, { churchId })

    // Revalidate department detail page
    if (churchId) {
      revalidatePath(`/${churchId}/dashboard/departments/${departmentId}`)
    }
  } catch (error) {
    console.error('Error removing member from department:', error)
    throw error
  }
}

// Function to add a leader to a department (sets isLeader = true)
export async function addDepartmentLeader(
  departmentId: string,
  memberId: string,
  churchId: string
): Promise<any> {
  try {
    const result = await apiPost(`/departments/${departmentId}/leaders`, {
      memberId,
      churchId,
    })

    // Revalidate department detail page
    if (churchId) {
      revalidatePath(`/${churchId}/dashboard/departments/${departmentId}`)
    }

    return result
  } catch (error) {
    console.error('Error adding department leader:', error)
    throw error
  }
}

// Function to remove a leader from a department (unsets isLeader)
export async function removeDepartmentLeader(
  departmentId: string,
  memberId: string,
  churchId: string
): Promise<any> {
  try {
    const result = await apiDelete(`/departments/${departmentId}/leaders/${memberId}`, { churchId })

    // Revalidate department detail page
    if (churchId) {
      revalidatePath(`/${churchId}/dashboard/departments/${departmentId}`)
    }

    return result
  } catch (error) {
    console.error('Error removing department leader:', error)
    throw error
  }
}

// Function to get department statistics
export async function getDepartmentStats(churchId: string, departmentId: string): Promise<any> {
  try {
    return await apiGet(`/departments/${departmentId}/stats`, { churchId })
  } catch (error) {
    console.error('Error fetching department stats:', error)
    return { totalMembers: 0, leaders: 0, regularMembers: 0 }
  }
}
