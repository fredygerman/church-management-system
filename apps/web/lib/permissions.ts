/**
 * Frontend Permission System
 * Mirrors the backend RBAC permission structure
 */

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  BRANCH_ADMIN = 'branch_admin',
  ZONE_LEADER = 'zone_leader',
  MEMBER = 'member',
}

export type PermissionAction =
  | 'create:member'
  | 'read:member'
  | 'update:member'
  | 'delete:member'
  | 'manage:zones'
  | 'manage:families'
  | 'view:families'
  | 'view:visitors'
  | 'create:visitor'
  | 'update:visitor'
  | 'manage:departments'
  | 'create:visitation'
  | 'read:visitation'

/**
 * Permission map defining what each role can do
 * Must match backend: apps/api/src/auth/types/permission.types.ts
 */
export const PERMISSION_MAP: Record<UserRole, PermissionAction[]> = {
  [UserRole.SUPER_ADMIN]: [
    'create:member',
    'read:member',
    'update:member',
    'delete:member',
    'manage:zones',
    'manage:families',
    'view:families',
    'view:visitors',
    'create:visitor',
    'update:visitor',
    'manage:departments',
    'create:visitation',
    'read:visitation',
  ],

  [UserRole.ADMIN]: [
    'create:member',
    'read:member',
    'update:member',
    'delete:member',
    'manage:zones',
    'manage:families',
    'view:families',
    'view:visitors',
    'create:visitor',
    'update:visitor',
    'manage:departments',
    'create:visitation',
    'read:visitation',
  ],

  [UserRole.BRANCH_ADMIN]: [
    'create:member',
    'read:member',
    'update:member',
    'manage:zones',
    'view:families',
    'view:visitors',
    'create:visitor',
    'update:visitor',
    'manage:departments',
    'create:visitation',
    'read:visitation',
  ],

  [UserRole.ZONE_LEADER]: [
    'read:member',
    'view:families',
    'create:visitation',
    'read:visitation',
  ],

  [UserRole.MEMBER]: [
    'read:member', // Own profile only
  ],
}

/**
 * Check if a user role has a specific permission
 */
export function hasPermission(
  userRole: string | undefined,
  permission: PermissionAction
): boolean {
  if (!userRole) return false
  
  const role = userRole as UserRole
  const permissions = PERMISSION_MAP[role]
  
  if (!permissions) return false
  
  return permissions.includes(permission)
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(
  userRole: string | undefined,
  permissions: PermissionAction[]
): boolean {
  return permissions.some(permission => hasPermission(userRole, permission))
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(
  userRole: string | undefined,
  permissions: PermissionAction[]
): boolean {
  return permissions.every(permission => hasPermission(userRole, permission))
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(userRole: string | undefined): PermissionAction[] {
  if (!userRole) return []
  
  const role = userRole as UserRole
  return PERMISSION_MAP[role] || []
}

/**
 * Check if user is admin level (super_admin, admin, or branch_admin)
 */
export function isAdmin(userRole: string | undefined): boolean {
  if (!userRole) return false
  
  return [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.BRANCH_ADMIN,
  ].includes(userRole as UserRole)
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(userRole: string | undefined): boolean {
  return userRole === UserRole.SUPER_ADMIN
}
