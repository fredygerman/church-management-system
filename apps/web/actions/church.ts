'use server'

import { apiRequest } from '@/lib/api-client'

export async function getChurches() {
  try {
    const response = await apiRequest({
      requestConfig: {
        method: 'GET',
        url: '/churches',
      },
    })

    if (!response.success) {
      console.error('Failed to fetch churches:', response.message)
      return []
    }

    return response.data || []
  } catch (error) {
    console.error('Error fetching churches:', error)
    return []
  }
}

export async function createChurch(data: {
  name: string
  location: string
  leadPastorName: string
  phone?: string
  email?: string
  description?: string
}) {
  const response = await apiRequest({
    requestConfig: {
      method: 'POST',
      url: '/churches',
      data,
    },
  })

  if (!response.success) {
    throw new Error(response.message || 'Failed to create church')
  }

  return response.data
}

export async function updateChurch(
  id: string,
  data: {
    name?: string
    location?: string
    leadPastorName?: string
    phone?: string
    email?: string
    description?: string
  }
) {
  const response = await apiRequest({
    requestConfig: {
      method: 'PUT',
      url: `/churches/${id}`,
      data,
    },
  })

  if (!response.success) {
    throw new Error(response.message || 'Failed to update church')
  }

  return response.data
}

export async function deleteChurch(id: string) {
  const response = await apiRequest({
    requestConfig: {
      method: 'DELETE',
      url: `/churches/${id}`,
    },
  })

  if (!response.success) {
    throw new Error(response.message || 'Failed to delete church')
  }

  return response.data
}

