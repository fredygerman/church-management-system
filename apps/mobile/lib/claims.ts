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

// The permissions the staff tabs check. The access token and /users/me carry only the role, so the
// grants are copied from PERMISSION_MAP in packages/config/src/permissions.ts. Importing @church/config
// here would pull @church/db (native bcrypt) into the app bundle. Keep in sync; the API checks every call.
export type StaffTabPermission = "read:member" | "view:attendance" | "manage:files"

export const STAFF_TAB_PERMISSIONS: Record<string, StaffTabPermission[]> = {
  super_admin: ["read:member", "view:attendance", "manage:files"],
  admin: ["read:member", "view:attendance", "manage:files"],
  branch_admin: ["read:member", "view:attendance", "manage:files"],
  zone_leader: ["read:member", "view:attendance"],
  department_leader: ["read:member", "view:attendance"],
}

export function roleHasTabPermission(role: string | undefined, permission: StaffTabPermission): boolean {
  // Own keys only: a role such as "constructor" must not resolve to an inherited Object property.
  return Boolean(role && Object.hasOwn(STAFF_TAB_PERMISSIONS, role) && STAFF_TAB_PERMISSIONS[role].includes(permission))
}
