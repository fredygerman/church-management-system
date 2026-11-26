// Server-only refresh-token rotation shared by auth.ts (jwt callback) and api-client.ts.
// The API consumes a refresh token when it rotates it, so a session cookie that still
// holds an old one must be mapped to the newest pair, never replayed.

export type RotatedTokens = {
  accessToken: string
  refreshToken: string
  accessExpiresAt: number // epoch seconds, from the access token's exp claim
}

type RefreshError = Error & { status?: number }

// The API answers 401 with this message when a token was used a moment ago (a parallel refresh).
// It is not a reuse, so the session must survive it: the newer cookie carries the next request.
export const REFRESH_IN_PROGRESS = "Refresh already in progress"

export class RefreshInProgressError extends Error {
  readonly status = 401
  constructor() {
    super("Token refresh is already in progress; retry with the newer session")
    this.name = "RefreshInProgressError"
  }
}

// Newest pair known to this process, keyed by the refresh token the session holds.
const latest = new Map<string, RotatedTokens>()
// Refresh calls in flight, keyed by the unconsumed refresh token being sent.
const inFlight = new Map<string, Promise<RotatedTokens>>()
// Session refresh tokens the API has rejected; never sent again in this process.
const rejected = new Set<string>()

// Bounds the per-process maps; the oldest entry goes first.
const MAX_TRACKED = 1000
function remember<V>(map: Map<string, V>, key: string, value: V) {
  map.delete(key)
  map.set(key, value)
  if (map.size > MAX_TRACKED) map.delete(map.keys().next().value as string)
}

export function decodeJwtPayload(token: string): Record<string, any> {
  return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString())
}

/** Copies a rotated pair and the claims of its access token onto a NextAuth JWT. */
export function applyRotatedTokens<T extends Record<string, any>>(token: T, rotated: RotatedTokens): T {
  const payload = decodeJwtPayload(rotated.accessToken)
  return {
    ...token,
    accessToken: rotated.accessToken,
    refreshToken: rotated.refreshToken,
    expiresAt: rotated.accessExpiresAt,
    role: payload.activeRole || payload.role,
    churchId: payload.activeChurchId || payload.churchId,
    activeChurchId: payload.activeChurchId || payload.churchId,
    activeMembershipId: payload.activeMembershipId,
    activeRole: payload.activeRole || payload.role,
    assignedZoneId: payload.assignedZoneId,
  }
}

async function rotate(apiBaseUrl: string, refreshToken: string): Promise<RotatedTokens> {
  const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  })
  const body = await response.json().catch(() => null)
  if (response.status === 401 && JSON.stringify(body ?? "").includes(REFRESH_IN_PROGRESS)) {
    throw new RefreshInProgressError()
  }
  const data = body?.data ?? body
  if (!response.ok || typeof data?.accessToken !== "string" || typeof data?.refreshToken !== "string") {
    const error = new Error(`Token refresh failed (${response.status})`) as RefreshError
    error.status = response.status
    throw error
  }
  let accessExpiresAt = Math.floor(Date.now() / 1000) + 3600
  try {
    const exp = decodeJwtPayload(data.accessToken).exp
    if (typeof exp === "number") accessExpiresAt = exp
  } catch {
    // Non-JWT access token: keep the one-hour fallback.
  }
  return { accessToken: data.accessToken, refreshToken: data.refreshToken, accessExpiresAt }
}

// Returns usable tokens for a session holding `sessionRefreshToken`.
// Concurrent callers share one refresh; a later call with the same session token reuses the pair.
export function getRotatedTokens(apiBaseUrl: string, sessionRefreshToken: string): Promise<RotatedTokens> {
  if (rejected.has(sessionRefreshToken)) {
    return Promise.reject(new Error("Refresh token was rejected; sign in again"))
  }

  const known = latest.get(sessionRefreshToken)
  if (known && known.accessExpiresAt > Date.now() / 1000 + 30) return Promise.resolve(known)

  // Refresh with the newest unconsumed token: the session token may already be consumed.
  const sendToken = known?.refreshToken ?? sessionRefreshToken
  let pending = inFlight.get(sendToken)
  if (!pending) {
    pending = rotate(apiBaseUrl, sendToken)
      .then((pair) => {
        remember(latest, sessionRefreshToken, pair)
        return pair
      })
      .catch((error: RefreshError) => {
        // A parallel refresh is not a rejection: keep the session token usable.
        if (error instanceof RefreshInProgressError) throw error
        // A rejected token must not be replayed; a network error may be retried.
        if (error.status === 401 || error.status === 403) {
          rejected.add(sessionRefreshToken)
          if (rejected.size > MAX_TRACKED) rejected.delete(rejected.values().next().value as string)
        }
        throw error
      })
      .finally(() => inFlight.delete(sendToken))
    inFlight.set(sendToken, pending)
  }
  return pending
}
