"use server"

import { revalidatePath } from "next/cache"
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-helpers"

// ============================================
// Giving Goals
// ============================================

export interface GivingGoalInput {
  name: string
  description?: string
  targetCents: number
  currency: string
  startDate?: string
  endDate?: string
  isPublic?: boolean
}

// Staff list - church-scoped, includes private goals, requires manage:giving-goals.
export async function getGivingGoals(churchId: string): Promise<any[]> {
  try {
    const result = await apiGet("/giving-goals", { churchId })
    return Array.isArray(result) ? result : []
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error
    }
    console.error("Error fetching giving goals:", error)
    return []
  }
}

// Member-facing list - public goals only, embeds donorWallNames, requires view:giving-goals.
export async function getPublicGivingGoals(churchId: string): Promise<any[]> {
  try {
    const result = await apiGet("/giving-goals/public", { churchId })
    return Array.isArray(result) ? result : []
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error
    }
    console.error("Error fetching public giving goals:", error)
    return []
  }
}

export async function getGivingGoalById(churchId: string, id: string): Promise<any> {
  try {
    return await apiGet(`/giving-goals/${id}`, { churchId })
  } catch (error) {
    console.error("Error fetching giving goal:", error)
    throw error
  }
}

export async function createGivingGoal(data: GivingGoalInput & { churchId: string }): Promise<any> {
  try {
    const goal = await apiPost("/giving-goals", data)
    revalidatePath(`/${data.churchId}/dashboard/offerings/goals`)
    return goal
  } catch (error) {
    console.error("Error creating giving goal:", error)
    throw error
  }
}

export async function updateGivingGoal(
  id: string,
  data: Partial<GivingGoalInput>,
  churchId: string
): Promise<any> {
  try {
    const result = await apiPut(`/giving-goals/${id}`, { ...data, churchId })
    revalidatePath(`/${churchId}/dashboard/offerings/goals`)
    return result
  } catch (error) {
    console.error("Error updating giving goal:", error)
    throw error
  }
}

export async function deleteGivingGoal(id: string, churchId: string): Promise<void> {
  try {
    await apiDelete(`/giving-goals/${id}`, { churchId })
    revalidatePath(`/${churchId}/dashboard/offerings/goals`)
  } catch (error) {
    console.error("Error deleting giving goal:", error)
    throw error
  }
}

// Linked offerings for staff reconciliation (gated on manage:offerings server-side).
export async function getGivingGoalOfferings(churchId: string, id: string): Promise<any[]> {
  try {
    const result = await apiGet(`/giving-goals/${id}/offerings`, { churchId })
    return Array.isArray(result) ? result : []
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error
    }
    console.error("Error fetching giving goal offerings:", error)
    return []
  }
}
