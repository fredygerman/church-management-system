'use server'

import { getSession } from '@/auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function getChurches() {
  const session = await getSession()
  if (!session?.accessToken) {
    throw new Error('Unauthorized')
  }

  const response = await fetch(`${API_BASE_URL}/churches`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch churches')
  }

  return response.json()
}

export async function createChurch(data: {
  name: string
  location: string
  leadPastorName: string
  phone?: string
  email?: string
  description?: string
}) {
  const session = await getSession()
  if (!session?.accessToken) {
    throw new Error('Unauthorized')
  }

  const response = await fetch(`${API_BASE_URL}/churches`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create church')
  }

  return response.json()
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
  const session = await getSession()
  if (!session?.accessToken) {
    throw new Error('Unauthorized')
  }

  const response = await fetch(`${API_BASE_URL}/churches/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update church')
  }

  return response.json()
}

export async function deleteChurch(id: string) {
  const session = await getSession()
  if (!session?.accessToken) {
    throw new Error('Unauthorized')
  }

  const response = await fetch(`${API_BASE_URL}/churches/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to delete church')
  }

  return response.json()
}
