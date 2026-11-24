// Reads the active church and role from an access token. The API signs these claims,
// so the app only reads them to decide which area to show; the API still checks every call.

export type AccessClaims = {
  activeChurchId?: string
  activeRole?: string
}

export function decodeAccessClaims(accessToken: string): AccessClaims {
  try {
    const part = accessToken.split(".")[1] ?? ""
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "=")
    const claims = JSON.parse(atob(base64)) as Record<string, unknown>
    return {
      activeChurchId: typeof claims.activeChurchId === "string" ? claims.activeChurchId : undefined,
      activeRole: typeof claims.activeRole === "string" ? claims.activeRole : undefined,
    }
  } catch {
    return {}
  }
}

/** Staff areas are for every role except the plain member role. */
export function isStaffRole(role: string | undefined): boolean {
  return Boolean(role) && role !== "member"
}
