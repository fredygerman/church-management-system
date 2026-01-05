import { NextRequest, NextResponse } from "next/server"

// Use localhost for better compatibility with local dev servers
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3001"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, picture } = body

    if (!email || !name) {
      return NextResponse.json(
        { error: "Missing email or name" },
        { status: 400 }
      )
    }

    console.log(`[Auth Callback] Syncing user with backend: ${email}`)

    // Call backend OAuth endpoint
    const response = await fetch(`${API_BASE_URL}/auth/oauth-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        name,
        picture,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }))
      console.error(`[Auth Callback] Backend error (${response.status}):`, errorData)
      return NextResponse.json(
        { error: errorData.message || `Backend error: ${response.statusText}` },
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
