import type { MessageKey } from "@church/config/i18n"
import { api, ApiError } from "../../lib/api"

export type ChurchMembership = {
  churchId: string
  churchName: string
  role: string
  status: string
}

/** GET /auth/memberships: the caller's active church memberships. */
export async function listMemberships(): Promise<ChurchMembership[]> {
  const rows = await api.get<ChurchMembership[]>("/auth/memberships")
  return rows ?? []
}

export type JoinResult = { churchName?: string }

/**
 * POST /churches/join with {code}. Contract (lane 10 API, built in parallel):
 * 202 { status: 'pending_approval', churchName }. Errors: 404 INVALID_CODE, 409 ALREADY_MEMBER, 429 rate limited.
 */
export async function submitJoinCode(code: string): Promise<JoinResult> {
  const result = await api.post<{ status?: string; churchName?: string }>("/churches/join", { code })
  return { churchName: result?.churchName }
}

/**
 * Maps a join failure to a localised message key. The server's text is never shown: only the HTTP status is used,
 * because the API client does not expose the server's error code.
 */
export function joinErrorKey(error: unknown): MessageKey {
  if (error instanceof ApiError) {
    if (error.kind === "network") return "join.error.network"
    if (error.status === 404) return "join.error.invalidCode"
    if (error.status === 409) return "join.error.alreadyMember"
    if (error.status === 429) return "join.error.rateLimited"
  }
  return "join.error.generic"
}
