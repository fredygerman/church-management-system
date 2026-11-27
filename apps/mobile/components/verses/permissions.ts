import { PERMISSION_MAP, type UserRole } from "@church/config/permissions"

export type VersePermission = "view:verses" | "manage:verses"

/**
 * Verse permissions are checked on the client only to decide which controls to show; the API enforces them on every call.
 * The shared PERMISSION_MAP does not list them yet, so until packages/config adds them every role sees the screen read-only.
 */
export function roleHasVersePermission(role: string | null | undefined, permission: VersePermission): boolean {
  // Own keys only: a role such as "constructor" must not resolve to an inherited Object property.
  if (!role || !Object.hasOwn(PERMISSION_MAP, role)) return false
  return (PERMISSION_MAP[role as UserRole] as readonly string[]).includes(permission)
}
