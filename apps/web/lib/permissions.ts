/**
 * Frontend permission utilities powered by shared @church/config definitions.
 */

import {
  PERMISSION_MAP,
  UserRole,
  getPermissionsForRole,
  roleHasPermission,
  type PermissionAction,
} from "@church/config"

export { UserRole, PERMISSION_MAP, type PermissionAction }

export function hasPermission(
  userRole: string | undefined,
  permission: PermissionAction
): boolean {
  if (!userRole) return false
  return roleHasPermission(userRole as UserRole, permission)
}

export function hasAnyPermission(
  userRole: string | undefined,
  permissions: PermissionAction[]
): boolean {
  return permissions.some((permission) => hasPermission(userRole, permission))
}

export function hasAllPermissions(
  userRole: string | undefined,
  permissions: PermissionAction[]
): boolean {
  return permissions.every((permission) => hasPermission(userRole, permission))
}

export function getRolePermissions(userRole: string | undefined): PermissionAction[] {
  if (!userRole) return []
  return getPermissionsForRole(userRole as UserRole)
}

export function isAdmin(userRole: string | undefined): boolean {
  if (!userRole) return false

  return [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.BRANCH_ADMIN,
  ].includes(userRole as UserRole)
}

export function isSuperAdmin(userRole: string | undefined): boolean {
  return userRole === UserRole.SUPER_ADMIN
}
