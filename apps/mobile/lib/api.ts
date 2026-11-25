import { API_BASE_URL } from "../config/api"
import { DEFAULT_LOCALE, translate, type Locale } from "@church/config/i18n"
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

// Errors raised in this module are translated with the language the user picked (set by LocaleProvider).
let apiLocale: Locale = DEFAULT_LOCALE
export function setApiLocale(locale: Locale) {
  apiLocale = locale
}

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

// The API rotates refresh tokens: a successful refresh consumes the presented one.
// Only one refresh may be in flight, so concurrent 401s share this promise.
let inFlightRefresh: Promise<StoredTokens> | null = null

async function refreshTokens(refreshToken: string): Promise<StoredTokens> {
  const response = await fetch(`${configuredBaseUrl()}/auth/refresh`, {
    body: JSON.stringify({ refreshToken }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })
  if (response.status === 401) throw new ApiError("Refresh token rejected", "http", 401)
  const tokens = await readEnvelope<StoredTokens>(response)
  // Persist the rotated pair: the old refresh token is no longer valid.
  await storeTokens(tokens)
  return tokens
}

function refreshSingleFlight(refreshToken: string): Promise<StoredTokens> {
  if (!inFlightRefresh) {
    inFlightRefresh = refreshTokens(refreshToken).finally(() => {
      inFlightRefresh = null
    })
  }
  return inFlightRefresh
}

async function send(path: string, init: RequestInit, accessToken?: string): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set("Content-Type", "application/json")
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`)

  try {
    return await fetch(`${configuredBaseUrl()}${path}`, { ...init, headers })
  } catch {
    throw new ApiError(translate(apiLocale, "final.api.network"), "network")
  }
}

async function expireSession(): Promise<never> {
  await clearStoredTokens()
  onSessionExpired?.()
  throw new ApiError(translate(apiLocale, "final.api.sessionExpired"), "http", 401)
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const sent = await getStoredTokens()
  const response = await send(path, init, sent?.accessToken)
  if (response.status !== 401 || !sent) return readEnvelope<T>(response)

  // Tokens may already have been rotated by a concurrent call; use them instead of refreshing again.
  let fresh = await getStoredTokens()
  if (!fresh || fresh.accessToken === sent.accessToken) {
    try {
      fresh = await refreshSingleFlight(sent.refreshToken)
    } catch {
      // A refresh that failed after another call rotated the token: use the stored pair.
      const current = await getStoredTokens()
      if (!current || current.refreshToken === sent.refreshToken) return expireSession()
      fresh = current
    }
  }

  // Retry once with the new access token; a second 401 means the session is gone.
  const retried = await send(path, init, fresh.accessToken)
  if (retried.status === 401) return expireSession()
  return readEnvelope<T>(retried)
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
