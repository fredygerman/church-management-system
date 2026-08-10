"use server"

import { revalidatePath } from "next/cache"
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-helpers"

// ============================================
// Offering Categories
// ============================================

export async function getOfferingCategories(churchId: string): Promise<any[]> {
  try {
    const result = await apiGet("/offering-categories", { churchId })
    return Array.isArray(result) ? result : []
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error
    }
    console.error("Error fetching offering categories:", error)
    return []
  }
}

export async function getOfferingCategoryById(churchId: string, id: string): Promise<any> {
  try {
    return await apiGet(`/offering-categories/${id}`, { churchId })
  } catch (error) {
    console.error("Error fetching offering category:", error)
    throw error
  }
}

export async function createOfferingCategory(data: {
  churchId: string
  name: string
  description?: string
}): Promise<any> {
  try {
    const category = await apiPost("/offering-categories", data)
    revalidatePath(`/${data.churchId}/dashboard/offerings/categories`)
    return category
  } catch (error) {
    console.error("Error creating offering category:", error)
    throw error
  }
}

export async function updateOfferingCategory(
  id: string,
  data: { name?: string; description?: string },
  churchId: string
): Promise<any> {
  try {
    const result = await apiPut(`/offering-categories/${id}`, { ...data, churchId })
    revalidatePath(`/${churchId}/dashboard/offerings/categories`)
    return result
  } catch (error) {
    console.error("Error updating offering category:", error)
    throw error
  }
}

export async function deleteOfferingCategory(id: string, churchId: string): Promise<void> {
  try {
    await apiDelete(`/offering-categories/${id}`, { churchId })
    revalidatePath(`/${churchId}/dashboard/offerings/categories`)
  } catch (error) {
    console.error("Error deleting offering category:", error)
    throw error
  }
}

// ============================================
// Offerings
// ============================================

export async function getOfferings(
  churchId: string,
  filters?: { categoryId?: string; memberId?: string; sessionId?: string; from?: string; to?: string }
): Promise<any[]> {
  try {
    const result = await apiGet("/offerings", { churchId, ...filters })
    return Array.isArray(result) ? result : []
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error
    }
    console.error("Error fetching offerings:", error)
    return []
  }
}

export async function getOfferingById(churchId: string, id: string): Promise<any> {
  try {
    return await apiGet(`/offerings/${id}`, { churchId })
  } catch (error) {
    console.error("Error fetching offering:", error)
    throw error
  }
}

export async function createOffering(data: {
  churchId: string
  categoryId: string
  amountCents: number
  currency: string
  offeringDate: string
  memberId?: string
  sessionId?: string
  note?: string
}): Promise<any> {
  try {
    const offering = await apiPost("/offerings", data)
    revalidatePath(`/${data.churchId}/dashboard/offerings`)
    return offering
  } catch (error) {
    console.error("Error creating offering:", error)
    throw error
  }
}

export async function updateOffering(
  id: string,
  data: {
    categoryId?: string
    amountCents?: number
    currency?: string
    offeringDate?: string
    memberId?: string
    sessionId?: string
    note?: string
  },
  churchId: string
): Promise<any> {
  try {
    const result = await apiPut(`/offerings/${id}`, { ...data, churchId })
    revalidatePath(`/${churchId}/dashboard/offerings`)
    return result
  } catch (error) {
    console.error("Error updating offering:", error)
    throw error
  }
}

export async function deleteOffering(id: string, churchId: string): Promise<void> {
  try {
    await apiDelete(`/offerings/${id}`, { churchId })
    revalidatePath(`/${churchId}/dashboard/offerings`)
  } catch (error) {
    console.error("Error deleting offering:", error)
    throw error
  }
}

// ============================================
// Reports
// ============================================

// Each row is scoped to a single (dimension, currency) pair - never sum rows
// with different currency values together when rendering.
export async function getOfferingReportSummary(
  churchId: string,
  groupBy: "category" | "period",
  options?: { period?: "week" | "month" | "year"; from?: string; to?: string }
): Promise<any[]> {
  try {
    const result = await apiGet("/offerings/reports/summary", { churchId, groupBy, ...options })
    return Array.isArray(result) ? result : []
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error
    }
    console.error("Error fetching offering report summary:", error)
    return []
  }
}

// ============================================
// Member self-service (portal)
// ============================================

export async function getMyOfferings(churchId: string): Promise<any[]> {
  try {
    const data = await apiGet("/offerings/me", { churchId })
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("Error fetching own offerings:", error)
    return []
  }
}
