/**
 * Re-export shared permissions from @church/config
 * 
 * This ensures both frontend and backend use the same permission definitions
 */

export type {
  PermissionAction,
  PermissionMetadata,
} from '@church/config'

export {
  UserRole,
  PERMISSION_MAP,
  PERMISSION_METADATA,
  getPermissionsForRole,
  roleHasPermission,
  getPermissionMetadata,
  getPermissionDenialReason,
} from '@church/config'

/**
 * User context attached to every authenticated request
 * Used by guards and controllers for permission checking
 */
export interface UserContext {
  id: string
  email: string
  role: string
  churchId: string
  assignedZoneId?: string
  workspaceId: string
  isActive: boolean
}
