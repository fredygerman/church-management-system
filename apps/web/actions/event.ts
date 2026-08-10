"use server"

import { revalidatePath } from "next/cache"
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-helpers"

// ============================================
// Events (staff)
// ============================================

export async function getEvents(
  churchId: string,
  filters?: { from?: string; to?: string; status?: string; scope?: string }
): Promise<any[]> {
  try {
    const result = await apiGet("/events", { churchId, ...filters })
    return Array.isArray(result) ? result : []
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error
    }
    console.error("Error fetching events:", error)
    return []
  }
}

export async function getEventById(churchId: string, id: string): Promise<any> {
  try {
    return await apiGet(`/events/${id}`, { churchId })
  } catch (error) {
    console.error("Error fetching event:", error)
    throw error
  }
}

export async function createEvent(data: {
  churchId: string
  title: string
  description?: string
  location?: string
  startsAt: string
  endsAt?: string
  scope?: "church" | "network"
  status?: "draft" | "published" | "cancelled"
}): Promise<any> {
  try {
    const event = await apiPost("/events", data)
    revalidatePath(`/${data.churchId}/dashboard/events`)
    return event
  } catch (error) {
    console.error("Error creating event:", error)
    throw error
  }
}

export async function updateEvent(
  id: string,
  data: {
    title?: string
    description?: string
    location?: string
    startsAt?: string
    endsAt?: string
    scope?: "church" | "network"
    status?: "draft" | "published" | "cancelled"
  },
  churchId: string
): Promise<any> {
  try {
    const result = await apiPut(`/events/${id}`, { ...data, churchId })
    revalidatePath(`/${churchId}/dashboard/events`)
    revalidatePath(`/${churchId}/dashboard/events/${id}`)
    return result
  } catch (error) {
    console.error("Error updating event:", error)
    throw error
  }
}

export async function deleteEvent(id: string, churchId: string): Promise<void> {
  try {
    await apiDelete(`/events/${id}`, { churchId })
    revalidatePath(`/${churchId}/dashboard/events`)
  } catch (error) {
    console.error("Error deleting event:", error)
    throw error
  }
}

// ============================================
// RSVP roster & attendance (staff)
// ============================================

export async function getEventRsvps(churchId: string, id: string): Promise<any> {
  try {
    return await apiGet(`/events/${id}/rsvps`, { churchId })
  } catch (error) {
    console.error("Error fetching event RSVPs:", error)
    return { rsvps: [], counts: { going: 0, maybe: 0, declined: 0 } }
  }
}

// Staff RSVP on a member's behalf, or register a walk-up.
export async function staffSetRsvp(input: {
  churchId: string
  eventId: string
  memberId: string
  status: "going" | "maybe" | "declined"
}): Promise<any> {
  try {
    const result = await apiPost(`/events/${input.eventId}/rsvps`, {
      churchId: input.churchId,
      memberId: input.memberId,
      status: input.status,
    })
    revalidatePath(`/${input.churchId}/dashboard/events/${input.eventId}`)
    return result
  } catch (error) {
    console.error("Error setting staff RSVP:", error)
    throw error
  }
}

export async function setEventAttendance(input: {
  churchId: string
  eventId: string
  attendedMemberIds?: string[]
  headcount?: number
}): Promise<any> {
  try {
    const result = await apiPut(`/events/${input.eventId}/attendance`, {
      churchId: input.churchId,
      attendedMemberIds: input.attendedMemberIds,
      headcount: input.headcount,
    })
    revalidatePath(`/${input.churchId}/dashboard/events/${input.eventId}`)
    return result
  } catch (error) {
    console.error("Error setting event attendance:", error)
    throw error
  }
}

// ============================================
// Member self-service (portal)
// ============================================

export async function getMyEventRsvps(churchId: string): Promise<any[]> {
  try {
    const result = await apiGet("/events/me", { churchId })
    return Array.isArray(result) ? result : []
  } catch (error) {
    console.error("Error fetching own event RSVPs:", error)
    return []
  }
}

export async function setMyRsvp(input: {
  churchId: string
  eventId: string
  status: "going" | "maybe" | "declined"
}): Promise<any> {
  try {
    const result = await apiPut(`/events/${input.eventId}/rsvp`, {
      churchId: input.churchId,
      status: input.status,
    })
    revalidatePath(`/${input.churchId}/portal/events`)
    return result
  } catch (error) {
    console.error("Error setting RSVP:", error)
    throw error
  }
}
