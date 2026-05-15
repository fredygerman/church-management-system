"use server"

import { apiGet, apiPatch, apiPost } from "@/lib/api-helpers"

export async function createUser(data: {
  email: string
  name: string
  picture?: string
}) {
  return apiPost(
    "/users",
    {
      email: data.email,
      name: data.name,
      picture: data.picture,
    },
    { skipAuth: true }
  )
}

export async function getUserByEmail(email: string) {
  try {
    return await apiGet("/users", { email }, { skipAuth: true })
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
}

export async function updateUserProfile(
  data: { picture?: string; name?: string; email?: string }
) {
  return apiPatch("/users/account", data)
}
