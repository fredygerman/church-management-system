/**
 * Centralized Permission System - Shared between Frontend & Backend
 * Location: packages/config/src/permissions
 * 
 * Defines all roles, permissions, and permission metadata
 * Used by both NestJS backend and Next.js frontend
 */

// ============================================================================
// USER ROLES
// ============================================================================

export enum UserRole {
  SUPER_ADMIN = 'super_admin',       // Global administrator - all access
  ADMIN = 'admin',                   // Church administrator
  BRANCH_ADMIN = 'branch_admin',     // Branch administrator
  ZONE_LEADER = 'zone_leader',       // Zone/small group leader
  MEMBER = 'member',                 // Regular church member
}

// ============================================================================
// PERMISSION ACTIONS
// ============================================================================

export type PermissionAction =
  // Members
  | 'create:member'
  | 'read:member'
  | 'update:member'
  | 'delete:member'
  
  // Visitors
  | 'view:visitors'
  | 'create:visitor'
  | 'read:visitor'
  | 'update:visitor'
  | 'delete:visitor'
  | 'convert:visitor'
  
  // Zones
  | 'create:zone'
  | 'read:zone'
  | 'update:zone'
  | 'delete:zone'
  | 'manage:zones'
  
  // Families
  | 'create:family'
  | 'read:family'
  | 'update:family'
  | 'delete:family'
  | 'manage:families'
  | 'view:families'
  
  // Visitation
  | 'create:visitation'
  | 'read:visitation'
  | 'update:visitation'
  | 'delete:visitation'
  
  // Administration
  | 'manage:departments'
  | 'manage:settings'
  | 'manage:users'
  | 'manage:churches'
  | 'view:users'
  | 'manage:files'
  | 'manage:mail'
  | 'manage:sms'
  | 'manage:services'
  | 'manage:attendance'
  | 'view:attendance'
  | 'manage:risk-settings'
  | 'view:risk-flags'
  | 'manage:communications'
  | 'view:communications'
  | 'send:communications'
  | 'manage:data-quality'
  | 'view:data-quality'
  | 'manage:attendance-analytics'
  | 'manage:lifecycle-rules'
  | 'view:lifecycle-dashboard'
  | 'read:self'
  | 'update:self'

// ============================================================================
// ROLE TO PERMISSIONS MAPPING
// ============================================================================

export const PERMISSION_MAP: Record<UserRole, PermissionAction[]> = {
  [UserRole.SUPER_ADMIN]: [
    // All permissions
    'create:member', 'read:member', 'update:member', 'delete:member',
    'view:visitors', 'create:visitor', 'read:visitor', 'update:visitor', 'delete:visitor', 'convert:visitor',
    'create:zone', 'read:zone', 'update:zone', 'delete:zone', 'manage:zones',
    'create:family', 'read:family', 'update:family', 'delete:family', 'manage:families', 'view:families',
    'create:visitation', 'read:visitation', 'update:visitation', 'delete:visitation',
    'manage:departments', 'manage:settings', 'manage:users', 'manage:churches', 'view:users',
    'manage:files', 'manage:mail', 'manage:sms',
    'manage:services', 'manage:attendance', 'view:attendance', 'manage:risk-settings', 'view:risk-flags',
    'manage:communications', 'view:communications', 'send:communications',
    'manage:data-quality', 'view:data-quality', 'manage:attendance-analytics',
    'manage:lifecycle-rules', 'view:lifecycle-dashboard',
    'read:self', 'update:self',
  ],

  [UserRole.ADMIN]: [
    // Same as SUPER_ADMIN but within church scope
    'create:member', 'read:member', 'update:member', 'delete:member',
    'view:visitors', 'create:visitor', 'read:visitor', 'update:visitor', 'delete:visitor', 'convert:visitor',
    'create:zone', 'read:zone', 'update:zone', 'delete:zone', 'manage:zones',
    'create:family', 'read:family', 'update:family', 'delete:family', 'manage:families', 'view:families',
    'create:visitation', 'read:visitation', 'update:visitation', 'delete:visitation',
    'manage:departments', 'manage:settings', 'view:users',
    'manage:services', 'manage:attendance', 'view:attendance', 'manage:risk-settings', 'view:risk-flags',
    'manage:communications', 'view:communications', 'send:communications',
    'manage:data-quality', 'view:data-quality', 'manage:attendance-analytics',
    'manage:lifecycle-rules', 'view:lifecycle-dashboard',
    'manage:files', 'manage:mail', 'manage:sms', 'read:self', 'update:self',
  ],

  [UserRole.BRANCH_ADMIN]: [
    'create:member', 'read:member', 'update:member',
    'view:visitors', 'create:visitor', 'read:visitor', 'update:visitor', 'convert:visitor',
    'create:zone', 'read:zone', 'update:zone', 'manage:zones',
    'read:family', 'view:families',
    'create:visitation', 'read:visitation',
    'manage:departments', 'view:users',
    'manage:services', 'manage:attendance', 'view:attendance', 'view:risk-flags',
    'manage:communications', 'view:communications', 'send:communications',
    'manage:data-quality', 'view:data-quality', 'manage:attendance-analytics',
    'manage:lifecycle-rules', 'view:lifecycle-dashboard',
    'manage:files', 'manage:sms', 'read:self', 'update:self',
  ],

  [UserRole.ZONE_LEADER]: [
    'read:member',
    'view:visitors', 'create:visitor', 'read:visitor',
    'read:zone',
    'view:attendance',
    'view:communications',
    'view:data-quality',
    'view:lifecycle-dashboard',
    'view:families',
    'create:visitation', 'read:visitation',
    'read:self', 'update:self',
  ],

  [UserRole.MEMBER]: [
    'read:member', // Own profile only
    'view:visitors', 'create:visitor',
    'view:attendance',
    'view:communications',
    'view:lifecycle-dashboard',
    'read:self', 'update:self',
  ],
}

// ============================================================================
// PERMISSION METADATA
// ============================================================================

export interface PermissionMetadata {
  label: string
  description: string
  category: 'member' | 'visitor' | 'zone' | 'family' | 'visitation' | 'admin' | 'attendance'
  riskLevel: 'low' | 'medium' | 'high'
}

export const PERMISSION_METADATA: Record<PermissionAction, PermissionMetadata> = {
  'create:member': {
    label: 'Create Member',
    description: 'Add new members to the church',
    category: 'member',
    riskLevel: 'medium',
  },
  'read:member': {
    label: 'View Member',
    description: 'View member details and information',
    category: 'member',
    riskLevel: 'low',
  },
  'update:member': {
    label: 'Edit Member',
    description: 'Update member information',
    category: 'member',
    riskLevel: 'medium',
  },
  'delete:member': {
    label: 'Delete Member',
    description: 'Delete member records',
    category: 'member',
    riskLevel: 'high',
  },
  'view:visitors': {
    label: 'View Visitors',
    description: 'View visitor list and details',
    category: 'visitor',
    riskLevel: 'low',
  },
  'create:visitor': {
    label: 'Create Visitor',
    description: 'Add new visitor records',
    category: 'visitor',
    riskLevel: 'low',
  },
  'read:visitor': {
    label: 'Read Visitor',
    description: 'View visitor details',
    category: 'visitor',
    riskLevel: 'low',
  },
  'update:visitor': {
    label: 'Edit Visitor',
    description: 'Update visitor information',
    category: 'visitor',
    riskLevel: 'medium',
  },
  'delete:visitor': {
    label: 'Delete Visitor',
    description: 'Delete visitor records',
    category: 'visitor',
    riskLevel: 'high',
  },
  'convert:visitor': {
    label: 'Convert Visitor',
    description: 'Convert visitor to church member',
    category: 'visitor',
    riskLevel: 'medium',
  },
  'create:zone': {
    label: 'Create Zone',
    description: 'Create new zones/groups',
    category: 'zone',
    riskLevel: 'medium',
  },
  'read:zone': {
    label: 'Read Zone',
    description: 'View zone details',
    category: 'zone',
    riskLevel: 'low',
  },
  'update:zone': {
    label: 'Edit Zone',
    description: 'Update zone information',
    category: 'zone',
    riskLevel: 'medium',
  },
  'delete:zone': {
    label: 'Delete Zone',
    description: 'Delete zone records',
    category: 'zone',
    riskLevel: 'high',
  },
  'manage:zones': {
    label: 'Manage Zones',
    description: 'Full zone management',
    category: 'zone',
    riskLevel: 'high',
  },
  'create:family': {
    label: 'Create Family',
    description: 'Create new family records',
    category: 'family',
    riskLevel: 'low',
  },
  'read:family': {
    label: 'Read Family',
    description: 'View family details',
    category: 'family',
    riskLevel: 'low',
  },
  'update:family': {
    label: 'Edit Family',
    description: 'Update family information',
    category: 'family',
    riskLevel: 'low',
  },
  'delete:family': {
    label: 'Delete Family',
    description: 'Delete family records',
    category: 'family',
    riskLevel: 'high',
  },
  'manage:families': {
    label: 'Manage Families',
    description: 'Full family management',
    category: 'family',
    riskLevel: 'high',
  },
  'view:families': {
    label: 'View Families',
    description: 'View family list and details',
    category: 'family',
    riskLevel: 'low',
  },
  'create:visitation': {
    label: 'Create Visitation',
    description: 'Log visitation activities',
    category: 'visitation',
    riskLevel: 'low',
  },
  'read:visitation': {
    label: 'Read Visitation',
    description: 'View visitation records',
    category: 'visitation',
    riskLevel: 'low',
  },
  'update:visitation': {
    label: 'Update Visitation',
    description: 'Update visitation records',
    category: 'visitation',
    riskLevel: 'low',
  },
  'delete:visitation': {
    label: 'Delete Visitation',
    description: 'Delete visitation records',
    category: 'visitation',
    riskLevel: 'medium',
  },
  'manage:departments': {
    label: 'Manage Departments',
    description: 'Manage church departments',
    category: 'admin',
    riskLevel: 'high',
  },
  'manage:settings': {
    label: 'Manage Settings',
    description: 'Manage church settings and configuration',
    category: 'admin',
    riskLevel: 'high',
  },
  'manage:users': {
    label: 'Manage Users',
    description: 'Manage user accounts and roles',
    category: 'admin',
    riskLevel: 'high',
  },
  'manage:churches': {
    label: 'Manage Churches',
    description: 'Create, edit, and delete churches/branches',
    category: 'admin',
    riskLevel: 'high',
  },
  'view:users': {
    label: 'View Users',
    description: 'View users in church context',
    category: 'admin',
    riskLevel: 'medium',
  },
  'manage:files': {
    label: 'Manage Files',
    description: 'Upload and manage files/documents',
    category: 'admin',
    riskLevel: 'medium',
  },
  'manage:mail': {
    label: 'Manage Mail',
    description: 'Trigger email workflows',
    category: 'admin',
    riskLevel: 'high',
  },
  'manage:sms': {
    label: 'Manage SMS',
    description: 'Trigger SMS notifications',
    category: 'admin',
    riskLevel: 'high',
  },
  'manage:services': {
    label: 'Manage Services',
    description: 'Create and manage service types and sessions',
    category: 'attendance',
    riskLevel: 'medium',
  },
  'manage:attendance': {
    label: 'Manage Attendance',
    description: 'Submit headcount and run check-ins',
    category: 'attendance',
    riskLevel: 'medium',
  },
  'view:attendance': {
    label: 'View Attendance',
    description: 'View attendance sessions and trend reports',
    category: 'attendance',
    riskLevel: 'low',
  },
  'manage:risk-settings': {
    label: 'Manage Risk Settings',
    description: 'Configure at-risk attendance thresholds',
    category: 'attendance',
    riskLevel: 'high',
  },
  'view:risk-flags': {
    label: 'View Risk Flags',
    description: 'View at-risk member queue',
    category: 'attendance',
    riskLevel: 'medium',
  },
  'manage:communications': {
    label: 'Manage Communications',
    description: 'Create and manage communication templates and campaigns',
    category: 'admin',
    riskLevel: 'high',
  },
  'view:communications': {
    label: 'View Communications',
    description: 'View communication campaigns and analytics',
    category: 'admin',
    riskLevel: 'low',
  },
  'send:communications': {
    label: 'Send Communications',
    description: 'Schedule and send communication campaigns',
    category: 'admin',
    riskLevel: 'high',
  },
  'manage:data-quality': {
    label: 'Manage Data Quality',
    description: 'Run imports, review duplicates, and perform merges',
    category: 'admin',
    riskLevel: 'high',
  },
  'view:data-quality': {
    label: 'View Data Quality',
    description: 'View import history and duplicate queues',
    category: 'admin',
    riskLevel: 'low',
  },
  'manage:attendance-analytics': {
    label: 'Manage Attendance Analytics',
    description: 'Manage advanced attendance trend and cohort operations',
    category: 'attendance',
    riskLevel: 'medium',
  },
  'manage:lifecycle-rules': {
    label: 'Manage Lifecycle Rules',
    description: 'Manage milestone notification and lifecycle rule configuration',
    category: 'family',
    riskLevel: 'high',
  },
  'view:lifecycle-dashboard': {
    label: 'View Lifecycle Dashboard',
    description: 'View lifecycle milestones and family care dashboard',
    category: 'family',
    riskLevel: 'low',
  },
  'read:self': {
    label: 'Read Own Account',
    description: 'Read own user profile/account',
    category: 'admin',
    riskLevel: 'low',
  },
  'update:self': {
    label: 'Update Own Account',
    description: 'Update own user profile/account',
    category: 'admin',
    riskLevel: 'medium',
  },
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all permissions for a user role
 */
export function getPermissionsForRole(role: UserRole): PermissionAction[] {
  return PERMISSION_MAP[role] ?? []
}

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: UserRole, permission: PermissionAction): boolean {
  return getPermissionsForRole(role).includes(permission)
}

/**
 * Get metadata for a permission
 */
export function getPermissionMetadata(permission: PermissionAction): PermissionMetadata {
  return PERMISSION_METADATA[permission] ?? {
    label: permission,
    description: 'Unknown permission',
    category: 'admin',
    riskLevel: 'medium',
  }
}

/**
 * Get user-friendly reason why permission is denied
 */
export function getPermissionDenialReason(permission: PermissionAction, role: UserRole): string {
  const metadata = getPermissionMetadata(permission)
  return `You don't have permission to "${metadata.label.toLowerCase()}". This action requires a higher role.`
}
