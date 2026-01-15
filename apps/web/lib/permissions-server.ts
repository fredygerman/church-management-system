/**
 * Server-side permission utilities for use in Server Components and Server Actions
 * Uses centralized permissions from @church/config
 */

import { getSession } from "@/auth"
import { 
  UserRole, 
  PERMISSION_MAP, 
  roleHasPermission,
  type PermissionAction 
} from "@church/config"

/**
 * Check if current session user has a specific permission (server-side)
 * @example
 * const canEdit = await checkPermission('update:visitor')
 */
export async function checkPermission(permission: PermissionAction): Promise<boolean> {
  const session = await getSession()
  
  if (!session?.user?.role) {
    return false
  }

  const userRole = (session.user.role || UserRole.MEMBER) as UserRole
  const permissions = PERMISSION_MAP[userRole] || []

  return permissions.includes(permission)
}

/**
 * Require a specific permission or throw error (server-side)
 * @throws Error if user doesn't have permission
 */
export async function requirePermission(permission: PermissionAction): Promise<void> {
  const hasAccess = await checkPermission(permission)
  
  if (!hasAccess) {
    throw new Error(`Forbidden: Missing permission '${permission}'`)
  }
}

/**
 * Check if current session user has any of the specified permissions (server-side)
 */
export async function checkAnyPermission(permissions: PermissionAction[]): Promise<boolean> {
  const session = await getSession()
  
  if (!session?.user?.role) {
    return false
  }

  const userRole = (session.user.role || UserRole.MEMBER) as UserRole
  const userPermissions = PERMISSION_MAP[userRole] || []

  return permissions.some(perm => userPermissions.includes(perm))
}

/**
 * Check if current session user has all of the specified permissions (server-side)
 */
export async function checkAllPermissions(permissions: PermissionAction[]): Promise<boolean> {
  const session = await getSession()
  if (!session?.user?.role) {
    return false
  }
  
  const userRole = (session.user.role || UserRole.MEMBER) as UserRole
  const userPermissions = PERMISSION_MAP[userRole] || []
  
  return permissions.every(perm => userPermissions.includes(perm))
}

/**
 * Check if current session user is admin level (server-side)
 */
export async function checkIsAdmin(): Promise<boolean> {
  const session = await getSession()
  if (!session?.user?.role) {
    return false
  }
  
  const userRole = (session.user.role || UserRole.MEMBER) as UserRole
  return [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BRANCH_ADMIN].includes(userRole)
}

/**
 * Check if current session user is super admin (server-side)
 */
export async function checkIsSuperAdmin(): Promise<boolean> {
  const session = await getSession()
  if (!session?.user?.role) {
    return false
  }
  
  const userRole = (session.user.role || UserRole.MEMBER) as UserRole
  return userRole === UserRole.SUPER_ADMIN
}

/**
 * Get current session user role (server-side)
 */
export async function getUserRole(): Promise<string | undefined> {
  const session = await getSession()
  return session?.user?.role
}
