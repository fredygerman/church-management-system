"use server"

import { apiRequest } from "@/lib/api-client"

export async function createUser(data: {
  email: string
  name: string
  picture?: string
}) {
  try {
    const response = await apiRequest({
      requestConfig: {
        method: "POST",
        url: "/users",
        data: {
          email: data.email,
          name: data.name,
          picture: data.picture,
        },
      },
      skipAuth: true,
    })

    if (!response.success) {
      throw new Error(response.message || "Failed to create user")
    }

    return response.data
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

export async function getUserByEmail(email: string) {
  try {
    const response = await apiRequest({
      requestConfig: {
        method: "GET",
        url: "/users",
        params: { email },
      },
      skipAuth: true,
    })

    if (!response.success) {
      // User not found is not an error - return null
      return null
    }

    return response.data
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
}

export async function updateUserProfile(
  data: { picture?: string; name?: string; email?: string }
) {
  try {
    const response = await apiRequest({
      requestConfig: {
        method: "PATCH",
        url: "/users/account",
        data,
      },
    })

    if (!response.success) {
      throw new Error(response.message || "Failed to update user")
    }

    return response.data
  } catch (error) {
    console.error("Error updating user:", error)
    throw error
  }
}
