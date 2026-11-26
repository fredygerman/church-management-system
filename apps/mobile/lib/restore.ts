import { ApiError } from "./api"
import type { StoredTokens } from "./storage"

export type Restored<U> = { status: "signed-out" } | { status: "authenticated"; user: U } | { status: "unavailable" }

export type RestoreDeps<U> = {
  readTokens: () => Promise<StoredTokens | null>
  loadUser: (tokens: StoredTokens) => Promise<U>
  clear: () => Promise<void>
}

/**
 * Startup decision. Only the API rejecting the session clears credentials and signs out.
 * An unreadable store or an unreachable/erroring API is "unavailable": the stored pair is kept for a retry.
 */
export async function restoreSession<U>(deps: RestoreDeps<U>): Promise<Restored<U>> {
  let tokens: StoredTokens | null
  try {
    tokens = await deps.readTokens()
  } catch {
    return { status: "unavailable" }
  }
  if (!tokens) return { status: "signed-out" }

  try {
    return { status: "authenticated", user: await deps.loadUser(tokens) }
  } catch (error) {
    if (error instanceof ApiError && error.kind === "rejected") {
      await deps.clear().catch(() => undefined)
      return { status: "signed-out" }
    }
    return { status: "unavailable" }
  }
}
