"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export interface GoogleOAuthTokenResponse {
  accessToken: string
  refreshToken?: string
  user: {
    id: string
    email: string
    name: string
    image?: string
  }
}

/**
 * Handle the OAuth callback from the backend
 * This is called after the user completes OAuth with the provider
 */
export async function handleOAuthCallback(
  provider: string,
  code: string,
  state?: string
) {
  try {
    const apiBase = process.env.API_BASE_URL || "http://127.0.0.1:3001"
    
    // Exchange the authorization code for tokens with the backend
    const response = await fetch(`${apiBase}/auth/${provider}/callback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        state,
      }),
    })

    if (!response.ok) {
      throw new Error(`OAuth callback failed: ${response.statusText}`)
    }

    const data: GoogleOAuthTokenResponse = await response.json()

    // Store tokens in secure HTTP-only cookies
    const cookieStore = await cookies()
    
    cookieStore.set("accessToken", data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    })

    if (data.refreshToken) {
      cookieStore.set("refreshToken", data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      })
    }

    // Get the return URL from cookies
    const returnUrl = cookieStore.get("returnTo")?.value || "/"
    
    // Clear the return URL cookie
    cookieStore.delete("returnTo")

    return { success: true, redirectUrl: returnUrl }
  } catch (error) {
    console.error("OAuth callback error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "OAuth callback failed",
    }
  }
}

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
