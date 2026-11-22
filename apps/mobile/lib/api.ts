import { API_BASE_URL } from "../config/api"
import { clearStoredTokens, getStoredTokens, storeTokens, type StoredTokens } from "./storage"

export class ApiError extends Error {
  status?: number
  kind: "not-configured" | "network" | "http"

  constructor(message: string, kind: ApiError["kind"], status?: number) {
    super(message)
    this.name = "ApiError"
    this.kind = kind
    this.status = status
  }
}

type ApiEnvelope<T> = { success: boolean; message?: string; data?: T }
let onSessionExpired: (() => void) | undefined

export function setSessionExpiredHandler(handler: (() => void) | undefined) {
  onSessionExpired = handler
}

function configuredBaseUrl() {
  if (!API_BASE_URL) {
    throw new ApiError("API is not configured. Set EXPO_PUBLIC_API_BASE_URL and try again.", "not-configured")
  }
  return API_BASE_URL.replace(/\/$/, "")
}

async function readEnvelope<T>(response: Response): Promise<T> {
  let body: ApiEnvelope<T> | undefined
  try {
    body = (await response.json()) as ApiEnvelope<T>
  } catch {
    body = undefined
  }

  if (!response.ok || body?.success === false) {
    throw new ApiError(body?.message || `Request failed (${response.status})`, "http", response.status)
  }
  return body?.data as T
}

async function refreshTokens(refreshToken: string): Promise<StoredTokens> {
  // The API does not rotate refresh tokens server-side; keep this to one retry.
  const response = await fetch(`${configuredBaseUrl()}/auth/refresh`, {
    body: JSON.stringify({ refreshToken }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })
  const tokens = await readEnvelope<StoredTokens>(response)
  await storeTokens(tokens)
  return tokens
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const tokens = await getStoredTokens()
  const headers = new Headers(init.headers)
  headers.set("Content-Type", "application/json")
  if (tokens?.accessToken) headers.set("Authorization", `Bearer ${tokens.accessToken}`)

  let response: Response
  try {
    response = await fetch(`${configuredBaseUrl()}${path}`, { ...init, headers })
  } catch {
    throw new ApiError("Unable to reach the API. Check your connection and try again.", "network")
  }

  if (response.status === 401 && retry && tokens?.refreshToken) {
    try {
      const nextTokens = await refreshTokens(tokens.refreshToken)
      return request<T>(path, { ...init, headers: { ...Object.fromEntries(headers.entries()), Authorization: `Bearer ${nextTokens.accessToken}` } }, false)
    } catch {
      await clearStoredTokens()
      onSessionExpired?.()
      throw new ApiError("Your session has expired. Please sign in again.", "http", 401)
    }
  }

  return readEnvelope<T>(response)
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { body: body === undefined ? undefined : JSON.stringify(body), method: "POST" }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { body: body === undefined ? undefined : JSON.stringify(body), method: "PATCH" }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { body: body === undefined ? undefined : JSON.stringify(body), method: "PUT" }),
}

export async function signOutRequest() {
  try {
    await api.post("/auth/logout")
  } catch {
    // Local credentials must be cleared even when logout cannot reach the API.
  } finally {
    await clearStoredTokens()
  }
}
