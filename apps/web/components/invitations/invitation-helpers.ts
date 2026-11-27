// Pure helpers and shared types for the join-code and join-request admin page.
// No server-only or React imports here, so the node tests can load this file directly.

export type InvitationCode = {
  id: string
  expiresAt: string
  maxUses: number
  uses: number
  revokedAt: string | null
  createdAt: string
}

export type CreatedInvitationCode = {
  id: string
  code: string
  expiresAt: string
  maxUses: number
  uses: number
}

export type MembershipRequest = {
  membershipId: string
  name: string
  email: string | null
  phone: string | null
  requestedAt: string
  invitationId: string
}

export type CodeStatus = "active" | "revoked" | "ended"

export const MAX_USES_RANGE = { min: 1, max: 500, default: 50 } as const
export const VALID_DAYS_RANGE = { min: 1, max: 90, default: 14 } as const

/** A code is active until it is revoked, expires, or reaches its use cap. */
export function getCodeStatus(
  code: Pick<InvitationCode, "expiresAt" | "maxUses" | "uses" | "revokedAt">,
  now: Date = new Date(),
): CodeStatus {
  if (code.revokedAt) return "revoked"
  const expiresAt = Date.parse(code.expiresAt)
  // An unreadable expiry is treated as ended rather than active.
  if (Number.isNaN(expiresAt) || expiresAt <= now.getTime()) return "ended"
  if (code.uses >= code.maxUses) return "ended"
  return "active"
}

export type CodeSettingsResult =
  | { ok: true; maxUses: number; validDays: number }
  | { ok: false; field: "maxUses" | "validDays" }

function parseWholeNumber(raw: string, range: { min: number; max: number }): number | null {
  const trimmed = raw.trim()
  if (trimmed === "") return null
  const value = Number(trimmed)
  if (!Number.isInteger(value) || value < range.min || value > range.max) return null
  return value
}

/** Checks the create form inputs against the API limits (maxUses 1-500, validDays 1-90). */
export function validateCodeSettings(input: { maxUses: string; validDays: string }): CodeSettingsResult {
  const maxUses = parseWholeNumber(input.maxUses, MAX_USES_RANGE)
  if (maxUses === null) return { ok: false, field: "maxUses" }
  const validDays = parseWholeNumber(input.validDays, VALID_DAYS_RANGE)
  if (validDays === null) return { ok: false, field: "validDays" }
  return { ok: true, maxUses, validDays }
}

/** The contact line for a request: email and phone joined, or an empty string when neither is set. */
export function requestContactLine(request: Pick<MembershipRequest, "email" | "phone">): string {
  return [request.email, request.phone]
    .map((value) => value?.trim() ?? "")
    .filter((value) => value !== "")
    .join(" · ")
}
