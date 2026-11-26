// Reads the active church and role from an access token. The API signs these claims,
// so the app only reads them to decide which area to show; the API still checks every call.

import { PERMISSION_MAP, type UserRole } from "@church/config/permissions"

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

// The permissions the staff tabs check. The grants come from PERMISSION_MAP, the same map the API checks.
// The "./permissions" subpath is client-safe; the root @church/config export pulls in @church/db (native bcrypt).
export type StaffTabPermission = "read:member" | "view:attendance" | "manage:files"

export function roleHasTabPermission(role: string | undefined, permission: StaffTabPermission): boolean {
  // Staff tabs are for staff only: the map gives members some self-service permissions, which are not tabs.
  // Own keys only: a role such as "constructor" must not resolve to an inherited Object property.
  if (!role || !isStaffRole(role) || !Object.hasOwn(PERMISSION_MAP, role)) return false
  return PERMISSION_MAP[role as UserRole].includes(permission)
}
