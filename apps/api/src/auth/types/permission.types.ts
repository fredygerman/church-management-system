export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  BRANCH_ADMIN = 'branch_admin',
  ZONE_LEADER = 'zone_leader',
  MEMBER = 'member',
}

export interface UserContext {
  id: string
  email: string
  role: UserRole
  churchId: string
  assignedZoneId?: string
  isActive: boolean
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
