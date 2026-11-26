"use server"

import { apiRequest } from "@/lib/api-client"

// Public, unauthenticated reads. Unpublished or deleted churches return not-found from the API.
export interface PublicChurchSummary {
  publicId: string
  name: string
  location: string | null
  about: string | null
  imageUrl: string | null
}

export interface PublicChurchDetail extends PublicChurchSummary {
  contact: { phone: string | null; email: string | null }
  events: Array<{
    id: string
    title: string
    description: string | null
    location: string | null
    startsAt: string
    endsAt: string | null
  }>
}

export interface PublicChurchPage {
  items: PublicChurchSummary[]
  pagination: { limit: number; offset: number; hasNext: boolean }
}

export async function listPublicChurches(
  input: { query?: string; offset?: number; limit?: number } = {}
): Promise<PublicChurchPage | null> {
  try {
    const response = await apiRequest<PublicChurchPage>({
      requestConfig: {
        method: "GET",
        url: "/public/churches",
        params: { query: input.query, offset: input.offset, limit: input.limit },
      },
      skipAuth: true,
    })
    return response.success && response.data ? response.data : null
  } catch (error) {
    console.error("Error loading public churches:", error)
    return null
  }
}

export async function getPublicChurch(publicId: string): Promise<PublicChurchDetail | null> {
  try {
    const response = await apiRequest<PublicChurchDetail>({
      requestConfig: { method: "GET", url: `/public/churches/${encodeURIComponent(publicId)}` },
      skipAuth: true,
    })
    return response.success && response.data ? response.data : null
  } catch (error) {
    console.error("Error loading public church:", error)
    return null
  }
}
