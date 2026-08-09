"use server"

import { apiGet, apiPost } from "@/lib/api-helpers"

// Self-service prayer requests for the signed-in member's own portal. Scoped
// server-side to the caller's own church + member record via the API's
// church context + self permissions.

export async function getMyPrayerRequests(churchId: string): Promise<any[]> {
  try {
    const data = await apiGet("/prayer-requests/me", { churchId })
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("Error fetching own prayer requests:", error)
    return []
  }
}

export async function createPrayerRequest(churchId: string, content: string): Promise<any> {
  return apiPost("/prayer-requests", { churchId, content })
}
