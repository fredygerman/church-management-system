"use server"

import { apiGet, apiPost } from "@/lib/api-helpers"

export async function createInitialChurch(data: {
  name: string
  location: string
  leadPastorName: string
  phone?: string
  email?: string
  description?: string
}) {
  try {
    const createdChurch = await apiPost("/churches", data)

    return {
      success: true,
      message: "Church created successfully",
      data: createdChurch,
    }
  } catch (error: any) {
    console.error("Error creating initial church:", error)
    return {
      success: false,
      message: error.message || "Failed to create church",
      data: null,
    }
  }
}

export async function checkUserSetupStatus() {
  try {
    const user = await apiGet("/users/account")
    return {
      needsSetup: !user?.church_id,
      hasChurch: !!user?.church_id,
      user,
    }
  } catch (error) {
    console.error("Error checking setup status:", error)
    return {
      needsSetup: true,
      hasChurch: false,
      user: null,
    }
  }
}
