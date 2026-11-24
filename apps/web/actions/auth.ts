"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

/**
 * Sign out the user by clearing tokens
 */
export async function signOutUser() {
  try {
    const cookieStore = await cookies()
    
    cookieStore.delete("accessToken")
    cookieStore.delete("refreshToken")
    cookieStore.delete("lastAuthMethod")
    
    redirect("/auth/signin")
  } catch (error) {
    console.error("Sign out error:", error)
    throw error
  }
}

/**
 * Get the current user's access token
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("accessToken")?.value
    return token || null
  } catch (error) {
    console.error("Error getting access token:", error)
    return null
  }
}

/**
 * Read OAuth tokens from secure cookies set by backend
 * Used by /auth/callback page to retrieve tokens for NextAuth sign-in
 * The caller (callback page) is responsible for calling signIn() with these tokens
 */
export async function getOAuthTokensFromCookies() {
  try {
    const cookieStore = await cookies()

    // Read tokens from temporary OAuth cookies set by backend
    const accessToken = cookieStore.get("__tokens_access")?.value
    const refreshToken = cookieStore.get("__tokens_refresh")?.value

    if (!accessToken || !refreshToken) {
      return {
        success: false,
        error: "No tokens found in secure cookies",
      }
    }

    // Single-use handoff: clear the relay cookies now that they've been read.
    // The real session lives in NextAuth's own cookie after signIn() below.
    cookieStore.delete("__tokens_access")
    cookieStore.delete("__tokens_refresh")

    return {
      success: true,
      tokens: {
        accessToken,
        refreshToken,
      },
    }
  } catch (error) {
    console.error("Error reading OAuth tokens from cookies:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to read tokens",
    }
  }
}
