"use server"

import { apiRequest } from "@/lib/api-client"
import { getSession } from "@/auth"

export async function createInitialChurch(data: {
  name: string
  location: string
  leadPastorName: string
  phone?: string
  email?: string
  description?: string
}) {
  const session = await getSession()
  
  if (!session?.user?.email) {
    return {
      success: false,
      message: "Not authenticated",
      data: null,
    }
  }

  try {
    const response = await apiRequest({
      requestConfig: {
        method: "POST",
        url: "/churches",
        data,
      },
    })

    if (!response.success) {
      return {
        success: false,
        message: response.message || "Failed to create church",
        data: null,
      }
    }

    return {
      success: true,
      message: "Church created successfully",
      data: response.data,
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
    const response = await apiRequest({
      requestConfig: {
        method: "GET",
        url: "/users/account",
      },
    })

    if (!response.success) {
      return {
        needsSetup: true,
        hasChurch: false,
        user: null,
      }
    }

    // Check if user has a church assigned
    const user = response.data
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
