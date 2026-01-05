"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export interface ApiResponse<D = any> {
  success: boolean
  message: string
  data?: D
  error?: any
  timestamp: string
  path: string
  statusCode: number
}

interface RequestConfig {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"
  url: string
  data?: any
  params?: Record<string, any>
  headers?: Record<string, string>
  skipAuth?: boolean
}

const getBaseUrl = (): string => {
  // Server-side only - use internal API URL if available
  if (typeof window === "undefined" && process.env.API_BASE_URL) {
    return process.env.API_BASE_URL
  }

  // Fallback to public API URL
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:3001"
  )
}

async function serverFetch<D = any>({
  requestConfig,
  token,
}: {
  requestConfig: RequestConfig
  token: string | null
}): Promise<ApiResponse<D>> {
  const baseUrl = getBaseUrl()
  const url = new URL(requestConfig.url, baseUrl)

  // Add query params to URL if they exist
  if (requestConfig.params) {
    Object.entries(requestConfig.params).forEach(([key, value]) => {
      // Only add non-null, non-undefined, and non-empty string values
      if (value !== null && value !== undefined && value !== "") {
        url.searchParams.append(key, String(value))
      }
    })
  }

  const headers = new Headers(
    (requestConfig.headers as Record<string, string>) || {}
  )

  const isFormData = requestConfig.data instanceof FormData

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  } else if (isFormData && headers.has("Content-Type")) {
    headers.delete("Content-Type")
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
    console.log(`[API] Token (first 50 chars): ${token.substring(0, 50)}...`)
  }

  const method = (requestConfig.method || "GET").toUpperCase()

  try {
    let body: any = undefined
    if (requestConfig.data) {
      if (isFormData) {
        body = requestConfig.data
      } else {
        body = JSON.stringify(requestConfig.data)
      }
    }

    console.log(`[API] ${method} ${url.toString()} with token: ${token ? "yes" : "no"}`)
    console.log(`[API] Base URL: ${baseUrl}`)
    if (requestConfig.data) {
      console.log(`[API] Request body:`, requestConfig.data)
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      body,
      cache: requestConfig.skipAuth ? "default" : ("no-store" as RequestCache),
    })

    console.log(`[API] Response status: ${response.status}`)
    const contentType = response.headers.get('content-type')
    console.log(`[API] Response Content-Type: ${contentType || 'unknown'}`)

    let data: ApiResponse<D> = {} as ApiResponse<D>
    try {
      data = await response.json()
    } catch (e) {
      console.error(`[API] Failed to parse JSON response from ${url.toString()}:`, e)
      return {
        success: false,
        message: 'Failed to parse API response',
        timestamp: new Date().toISOString(),
        path: url.pathname,
        statusCode: response.status,
      }
    }

    console.log(`[API] Response data:`, data)

    // Handle 401 errors - try to refresh token
    if (
      response.status === 401 &&
      !requestConfig.skipAuth &&
      token
    ) {
      try {
        // Get the session to access the refresh token
        const { getSession } = await import("@/auth")
        const session = await getSession()
        const refreshToken = session?.refreshToken

        if (refreshToken) {
          try {
            // Try to refresh the token via API
            const refreshResponse = await fetch(
              new URL("/auth/refresh", baseUrl).toString(),
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ refreshToken }),
                cache: "no-store",
              }
            )

            const refreshData = await refreshResponse.json()

            if (
              refreshResponse.ok &&
              refreshData?.data?.accessToken
            ) {
              const newAccessToken = refreshData.data.accessToken

              // Retry original request with new token
              const retryHeaders = new Headers(headers)
              retryHeaders.set("Authorization", `Bearer ${newAccessToken}`)

              const retryResponse = await fetch(url.toString(), {
                method,
                headers: retryHeaders,
                body,
                cache: requestConfig.skipAuth
                  ? "default"
                  : ("no-store" as RequestCache),
              })

              const retryData: ApiResponse<D> = await retryResponse.json()
              return retryData
            }
          } catch (refreshError) {
            // Ignore refresh error - proceed to login redirect
            console.error("[API] Token refresh failed:", refreshError)
          }
        }
      } catch (sessionError) {
        console.error("[API] Failed to get session for token refresh:", sessionError)
      }

      redirect("/auth/signin?error=session_expired")
    }

    return data
  } catch (error: any) {
    // Re-throw Next.js special errors (redirect, notFound, etc.)
    if (error?.message === 'NEXT_REDIRECT' || error?.digest?.includes('NEXT_REDIRECT')) {
      throw error
    }
    
    console.error("[API] Request failed:", {
      url: url.toString(),
      method,
      message: error?.message || 'Unknown error',
      code: error?.code || undefined,
      errno: error?.errno || undefined,
      cause: error?.cause || undefined,
    })
    console.error("[API] Full error:", error)
    
    return {
      success: false,
      message: error?.message || "Request failed",
      error: {
        code: error?.code,
        name: error?.name,
      },
      timestamp: new Date().toISOString(),
      path: url.pathname,
      statusCode: 0,
    } as ApiResponse<D>
  }
}

export async function apiRequest<D = any>({
  requestConfig,
  skipAuth = false,
}: {
  requestConfig: RequestConfig
  skipAuth?: boolean
}): Promise<ApiResponse<D>> {
  let token: string | null = null

  if (!skipAuth) {
    try {
      // Import here to avoid circular dependencies
      const { getSession } = await import("@/auth")
      const session = await getSession()
      token = session?.accessToken ?? null
      
      // If no session token, try to get from cookies (for backward compatibility)
      if (!token) {
        const cookieStore = await cookies()
        token = cookieStore.get("accessToken")?.value ?? null
      }

      console.log(`[API] Session token: ${token ? "found" : "not found"}`)
    } catch (error) {
      // During static generation, cookies() may fail
      console.warn("[API] Failed to get token:", error)
    }
  }

  console.log(`[API] Request config:`, {
    method: requestConfig.method || "GET",
    url: requestConfig.url,
    skipAuth,
  })

  return serverFetch<D>({
    requestConfig: {
      ...requestConfig,
      skipAuth,
      headers: {
        ...(requestConfig.headers || {}),
        ...(!(requestConfig.data instanceof FormData) && {
          "Content-Type": "application/json",
        }),
      },
    },
    token,
  })
}
