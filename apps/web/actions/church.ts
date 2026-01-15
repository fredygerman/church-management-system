'use server'

import { apiRequest } from '@/lib/api-client'
import { handleApiError } from '@/lib/error-handler'

export async function getChurches() {
  try {
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
  } catch (error) {
    // Re-throw Next.js control flow errors (redirect, notFound, etc.)
    if (error instanceof Error && (error.message === 'NEXT_REDIRECT' || error.message?.includes('NEXT_REDIRECT'))) {
      throw error
    }
    throw error
  }
}

export async function getChurchById(churchId: string) {
  try {
    const response = await apiRequest({
      requestConfig: {
        method: 'GET',
        url: `/churches/${churchId}`,
      },
    })

    if (!response.success) {
      handleApiError(response)
    }

    return response.data || null
  } catch (error) {
    // Re-throw Next.js control flow errors (redirect, notFound, etc.)
    if (error instanceof Error && (error.message === 'NEXT_REDIRECT' || error.message?.includes('NEXT_REDIRECT'))) {
      throw error
    }
    throw error
  }
}

export async function setupChurch(data: {
  name: string
  location: string
  leadPastorName: string
  phone?: string
  email?: string
  description?: string
}) {
  try {
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
  } catch (error) {
    // Re-throw Next.js control flow errors
    if (error instanceof Error && (error.message === 'NEXT_REDIRECT' || error.message?.includes('NEXT_REDIRECT'))) {
      throw error
    }
    throw error
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
  try {
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
  } catch (error) {
    // Re-throw Next.js control flow errors
    if (error instanceof Error && (error.message === 'NEXT_REDIRECT' || error.message?.includes('NEXT_REDIRECT'))) {
      throw error
    }
    throw error
  }
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
  try {
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
  } catch (error) {
    // Re-throw Next.js control flow errors
    if (error instanceof Error && (error.message === 'NEXT_REDIRECT' || error.message?.includes('NEXT_REDIRECT'))) {
      throw error
    }
    throw error
  }
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

