import { NextRequest, NextResponse } from "next/server"
import { env } from "@/env.mjs"

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) ?? {}
    const { provider, idToken } = body

    if (provider !== "google" || typeof idToken !== "string" || !idToken.trim()) {
      return NextResponse.json(
        { error: "provider and idToken are required" },
        { status: 400 }
      )
    }

    // Call backend OAuth endpoint
    const response = await fetch(`${env.API_BASE_URL}/auth/oauth-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ provider, idToken }),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: response.status === 401 ? "OAuth authentication failed" : "Authentication service unavailable" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[Auth Callback] Connection failed to backend:", error.message)
    return NextResponse.json(
      { error: "Could not connect to authentication server. Please ensure the API is running." },
      { status: 503 }
    )
  }
}
