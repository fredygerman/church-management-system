import { API_BASE_URL } from "../config/api"
import { DEFAULT_LOCALE, translate, type Locale } from "@church/config/i18n"
import { clearStoredTokens, getStoredTokens, storeTokens, type StoredTokens } from "./storage"

/**
 * Error kinds:
 * - rejected: the API itself rejected the session (definitive). Credentials are cleared.
 * - network / http / malformed: temporary. Credentials are kept and the request can be retried.
 * - storage: the secure store could not be read or written. Credentials are kept.
 * - stale: the session changed (sign-out, sign-in, church switch) while the request was in flight.
 */
export class ApiError extends Error {
  status?: number
  kind: "not-configured" | "network" | "http" | "rejected" | "malformed" | "storage" | "stale"

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

// The API answers a parallel refresh (same token presented again within the grace window) with this 401.
// The family survives, so it is a temporary race, not a rejection.
const REFRESH_RACE_MESSAGE = "Refresh already in progress"

// Incremented by every credential write or clear. A renewal or request that started earlier must not write credentials.
let generation = 0
// A rotated pair the store refused to save. The old refresh token is already consumed, so this pair must be used.
let unpersisted: StoredTokens | null = null
let inFlightRefresh: Promise<StoredTokens> | null = null

// Storage writes run one at a time so a late write cannot land after a clear.
let storageChain: Promise<unknown> = Promise.resolve()
function serialized<T>(task: () => Promise<T>): Promise<T> {
  const next = storageChain.then(task, task)
  storageChain = next.catch(() => undefined)
  return next
}

function supersede() {
  generation++
  unpersisted = null
  inFlightRefresh = null
}

/** Stores a pair from sign-in or a church switch. Renewals started before this call are discarded. */
export function persistSession(tokens: StoredTokens): Promise<void> {
  supersede()
  return serialized(() => storeTokens(tokens))
}

/** Clears local credentials. Renewals started before this call cannot restore them. */
export function clearSession(): Promise<void> {
  supersede()
  return serialized(() => clearStoredTokens())
}

function configuredBaseUrl() {
  if (!API_BASE_URL) {
    throw new ApiError("API is not configured. Set EXPO_PUBLIC_API_BASE_URL and try again.", "not-configured")
  }
  return API_BASE_URL.replace(/\/$/, "")
}

async function readMessage(response: Response): Promise<string | undefined> {
  try {
    return ((await response.json()) as ApiEnvelope<unknown>).message
  } catch {
    return undefined
  }
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

function isStoredTokens(value: unknown): value is StoredTokens {
  const tokens = value as Partial<StoredTokens> | null
  return Boolean(tokens && typeof tokens.accessToken === "string" && typeof tokens.refreshToken === "string")
}

// The API rotates refresh tokens: a successful refresh consumes the presented one.
// Only one refresh may be in flight, so concurrent 401s share this promise.
async function refreshTokens(refreshToken: string, gen: number): Promise<StoredTokens> {
  let response: Response
  try {
    response = await fetch(`${configuredBaseUrl()}/auth/refresh`, {
      body: JSON.stringify({ refreshToken }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
  } catch {
    throw new ApiError(translate(apiLocale, "final.api.network"), "network")
  }

  if (response.status === 401) {
    const message = await readMessage(response)
    if (message === REFRESH_RACE_MESSAGE) throw new ApiError(message, "http", 401)
    throw new ApiError(translate(apiLocale, "final.api.sessionExpired"), "rejected", 401)
  }
  const tokens = await readEnvelope<StoredTokens>(response)
  if (!isStoredTokens(tokens)) throw new ApiError("Malformed refresh response", "malformed")
  if (gen !== generation) throw new ApiError(translate(apiLocale, "final.api.network"), "stale")

  // Persist the rotated pair. If the store refuses it, keep the pair in memory: the old refresh token is spent.
  await serialized(async () => {
    if (gen !== generation) return
    try {
      await storeTokens(tokens)
    } catch {
      unpersisted = tokens
    }
  })
  if (gen !== generation) throw new ApiError(translate(apiLocale, "final.api.network"), "stale")
  return tokens
}

function refreshSingleFlight(refreshToken: string, gen: number): Promise<StoredTokens> {
  if (!inFlightRefresh) {
    const pending = refreshTokens(refreshToken, gen).finally(() => {
      if (inFlightRefresh === pending) inFlightRefresh = null
    })
    inFlightRefresh = pending
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

/** The pair to use now: a rotated pair the store has not accepted yet wins over the stored one. */
async function currentTokens(): Promise<StoredTokens | null> {
  if (unpersisted) {
    const pending = unpersisted
    try {
      await serialized(() => storeTokens(pending))
      if (unpersisted === pending) unpersisted = null
    } catch {
      // Still unsaved: keep using the in-memory pair.
    }
    return pending
  }
  try {
    return await getStoredTokens()
  } catch {
    throw new ApiError(translate(apiLocale, "final.api.network"), "storage")
  }
}

async function expireSession(gen: number): Promise<never> {
  if (gen !== generation) throw new ApiError(translate(apiLocale, "final.api.network"), "stale")
  await clearSession()
  onSessionExpired?.()
  throw new ApiError(translate(apiLocale, "final.api.sessionExpired"), "rejected", 401)
}

async function renew(refreshToken: string, gen: number): Promise<StoredTokens> {
  try {
    return await refreshSingleFlight(refreshToken, gen)
  } catch (error) {
    if (error instanceof ApiError && error.kind === "stale") throw error
    // Another call may have rotated the pair while this refresh was running: use the newer pair.
    const current = await currentTokens()
    if (current && current.refreshToken !== refreshToken) return current
    if (error instanceof ApiError && error.kind === "rejected") return expireSession(gen)
    // Temporary failure: keep the credentials so the next attempt can renew them.
    throw error
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const gen = generation
  const sent = await currentTokens()
  const response = await send(path, init, sent?.accessToken)
  if (response.status !== 401 || !sent) return readEnvelope<T>(response)

  // Tokens may already have been rotated by a concurrent call; use them instead of refreshing again.
  let fresh = await currentTokens()
  if (!fresh) throw new ApiError(translate(apiLocale, "final.api.network"), "stale")
  if (fresh.accessToken === sent.accessToken) fresh = await renew(sent.refreshToken, gen)

  // Retry once with the new access token; a second 401 means the session is gone.
  const retried = await send(path, init, fresh.accessToken)
  if (retried.status === 401) return expireSession(gen)
  return readEnvelope<T>(retried)
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { body: body === undefined ? undefined : JSON.stringify(body), method: "POST" }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { body: body === undefined ? undefined : JSON.stringify(body), method: "PATCH" }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { body: body === undefined ? undefined : JSON.stringify(body), method: "PUT" }),
}

export async function signOutRequest() {
  // Captured before clearing: the server revokes the session even though local credentials are gone.
  const sent = await currentTokens().catch(() => null)
  try {
    await clearSession()
  } finally {
    if (sent) await send("/auth/logout", { method: "POST" }, sent.accessToken).catch(() => undefined)
  }
}

