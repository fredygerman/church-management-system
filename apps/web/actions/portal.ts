"use server"

import { apiGet } from "@/lib/api-helpers"

// Self-service reads for the signed-in member's own portal (profile, family,
// attendance, announcements). All calls are scoped server-side to the caller's
// own member record / church via the API's church context + self permissions.

export async function getMyProfile(churchId: string): Promise<any | null> {
  try {
    return await apiGet("/members/me", { churchId })
  } catch (error) {
    console.error("Error fetching own profile:", error)
    return null
  }
}

export async function getMyFamily(churchId: string): Promise<any | null> {
  try {
    return await apiGet("/families/me", { churchId })
  } catch (error) {
    console.error("Error fetching own family:", error)
    return null
  }
}

export async function getMyAttendance(churchId: string): Promise<any[]> {
  try {
    const data = await apiGet("/attendance/me/checkins", { churchId })
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("Error fetching own attendance:", error)
    return []
  }
}

export async function getMyAnnouncements(churchId: string): Promise<any[]> {
  try {
    const data = await apiGet("/communications/announcements", { churchId })
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("Error fetching announcements:", error)
    return []
  }
}
