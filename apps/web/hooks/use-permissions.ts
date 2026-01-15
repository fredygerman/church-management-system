"use client"

import { useSession } from "next-auth/react"
import {
  UserRole,
  PERMISSION_MAP,
  type PermissionAction,
  getPermissionDenialReason,
} from "@church/config"

/**
 * Hook to check if current user has a specific permission
 * @example
 * const canEdit = usePermission('update:visitor')
 * if (canEdit) {
 *   return <EditButton />
 * }
 */
export function usePermission(permission: PermissionAction): boolean {
  const { data: session } = useSession()

  if (!session?.user) {
    return false
  }

  const userRole = (session.user.role || UserRole.MEMBER) as UserRole
  const permissions = PERMISSION_MAP[userRole] || []

  return permissions.includes(permission)
}

/**
 * Hook to check if current user has any of the specified permissions
 * @example
 * const canManage = useHasAnyPermission(['update:visitor', 'delete:visitor'])
 */
export function useHasAnyPermission(permissions: PermissionAction[]): boolean {
  const { data: session } = useSession()

  if (!session?.user) {
    return false
  }

  const userRole = (session.user.role || UserRole.MEMBER) as UserRole
  const userPermissions = PERMISSION_MAP[userRole] || []

  return permissions.some(perm => userPermissions.includes(perm))
}

/**
 * Hook to check if current user has all of the specified permissions
 * @example
 * const canFullyManage = useHasAllPermissions(['create:visitor', 'update:visitor', 'delete:visitor'])
 */
export function useHasAllPermissions(permissions: PermissionAction[]): boolean {
  const { data: session } = useSession()

  if (!session?.user) {
    return false
  }

  const userRole = (session.user.role || UserRole.MEMBER) as UserRole
  const userPermissions = PERMISSION_MAP[userRole] || []

  return permissions.every(perm => userPermissions.includes(perm))
}

/**
 * Hook to get all permissions for current user
 * @example
 * const permissions = useUserPermissions()
 * console.log('User has permissions:', permissions)
 */
export function useUserPermissions(): PermissionAction[] {
  const { data: session } = useSession()

  if (!session?.user) {
    return []
  }

  const userRole = (session.user.role || UserRole.MEMBER) as UserRole
  return PERMISSION_MAP[userRole] || []
}

/**
 * Hook to check if current user is admin level
 * @example
 * const isAdminUser = useIsAdmin()
 */
export function useIsAdmin(): boolean {
  const { data: session } = useSession()
  const userRole = (session?.user?.role || UserRole.MEMBER) as UserRole
  return userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN
}

/**
 * Hook to check if current user is super admin
 * @example
 * const isSuperAdminUser = useIsSuperAdmin()
 */
export function useIsSuperAdmin(): boolean {
  const { data: session } = useSession()
  return (session?.user?.role as UserRole) === UserRole.SUPER_ADMIN
}

/**
 * Hook to get current user role
 * @example
 * const role = useUserRole()
 */
export function useUserRole(): UserRole {
  const { data: session } = useSession()
  return (session?.user?.role as UserRole) || UserRole.MEMBER
}

/**
 * Hook to get permission denial reason
 * @example
 * const reason = usePermissionDenialReason('update:visitor')
 */
export function usePermissionDenialReason(permission: PermissionAction): string {
  const userRole = useUserRole()
  return getPermissionDenialReason(permission, userRole)
}
