'use server'

import { apiRequest } from '@/lib/api-client'
import { handleApiError } from '@/lib/error-handler'

export async function getChurches() {
  const response = await apiRequest({
    requestConfig: {
      method: 'GET',
      url: '/churches',
    },
  })

  if (!response.success) {
    handleApiError(response)
  }

  return response.data || []
}

export async function setupChurch(data: {
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
      url: '/auth/setup',
      data,
    },
  })

  if (!response.success) {
    throw new Error(response.message || 'Failed to setup church')
  }

  return response.data
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

