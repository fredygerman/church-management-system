'use server'

import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api-helpers'

export async function getChurches() {
  const data = await apiGet('/churches')
  return data || []
}

export async function getChurchById(churchId: string) {
  const data = await apiGet(`/churches/${churchId}`)
  return data || null
}

export async function setupChurch(data: {
  name: string
  location: string
  leadPastorName: string
  phone?: string
  email?: string
  description?: string
}) {
  return apiPost('/auth/setup', data)
}

export async function createChurch(data: {
  name: string
  location: string
  leadPastorName: string
  phone?: string
  email?: string
  description?: string
}) {
  return apiPost('/churches', data)
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
  return apiPut(`/churches/${id}`, data)
}

export async function deleteChurch(id: string) {
  return apiDelete(`/churches/${id}`)
}
