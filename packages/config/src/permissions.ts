/**
 * Centralized Permission System - Shared between Frontend & Backend
 * Location: packages/config/src/permissions
 * 
 * Defines all roles, permissions, and permission metadata
 * Used by both NestJS backend and Next.js frontend
 */

import type { MessageKey, Translate } from './i18n'

// ============================================================================
// USER ROLES
// ============================================================================

export enum UserRole {
  SUPER_ADMIN = 'super_admin',       // Global administrator - all access
  ADMIN = 'admin',                   // Church administrator
  BRANCH_ADMIN = 'branch_admin',     // Branch administrator
  ZONE_LEADER = 'zone_leader',       // Zone/small group leader
  DEPARTMENT_LEADER = 'department_leader', // Department/ministry leader
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
  | 'search:members'
  | 'view:announcements'
  | 'publish:announcements'
  | 'approve:announcements'
  | 'manage:invitations'
  | 'view:prayer-requests'
  
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
  | 'read:department'
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
  | 'create:prayer-request'
  | 'read:own-prayer-requests'

  // Offerings
  | 'manage:offerings'
  | 'view:giving-reports'
  | 'read:own-giving-history'
  | 'manage:giving-goals'
  | 'view:giving-goals'

  // Events
  | 'manage:events'
  | 'view:events'
  | 'rsvp:event'
  | 'manage:network-events'

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
    'manage:departments', 'read:department', 'manage:settings', 'manage:users', 'manage:churches', 'view:users',
    'manage:offerings', 'view:giving-reports', 'manage:giving-goals', 'view:giving-goals',
    'manage:files', 'manage:mail', 'manage:sms',
    'manage:services', 'manage:attendance', 'view:attendance', 'manage:risk-settings', 'view:risk-flags',
    'manage:communications', 'view:communications', 'send:communications',
    'view:announcements', 'publish:announcements', 'approve:announcements', 'manage:invitations', 'search:members',
    'manage:data-quality', 'view:data-quality', 'manage:attendance-analytics',
    'manage:lifecycle-rules', 'view:lifecycle-dashboard',
    'read:self', 'update:self', 'create:prayer-request', 'read:own-prayer-requests',
    'manage:events', 'view:events', 'rsvp:event', 'manage:network-events',
  ],

  [UserRole.ADMIN]: [
    // Same as SUPER_ADMIN but within church scope
    'create:member', 'read:member', 'update:member', 'delete:member',
    'view:visitors', 'create:visitor', 'read:visitor', 'update:visitor', 'delete:visitor', 'convert:visitor',
    'create:zone', 'read:zone', 'update:zone', 'delete:zone', 'manage:zones',
    'create:family', 'read:family', 'update:family', 'delete:family', 'manage:families', 'view:families',
    'create:visitation', 'read:visitation', 'update:visitation', 'delete:visitation',
    'manage:departments', 'read:department', 'manage:settings', 'view:users',
    'manage:offerings', 'view:giving-reports', 'manage:giving-goals', 'view:giving-goals',
    'manage:services', 'manage:attendance', 'view:attendance', 'manage:risk-settings', 'view:risk-flags',
    'manage:communications', 'view:communications', 'send:communications',
    'view:announcements', 'publish:announcements', 'approve:announcements', 'manage:invitations', 'search:members',
    'manage:data-quality', 'view:data-quality', 'manage:attendance-analytics',
    'manage:lifecycle-rules', 'view:lifecycle-dashboard',
    'manage:files', 'manage:mail', 'manage:sms', 'read:self', 'update:self', 'create:prayer-request', 'read:own-prayer-requests',
    'manage:events', 'view:events', 'rsvp:event', 'manage:network-events',
  ],

  [UserRole.BRANCH_ADMIN]: [
    'create:member', 'read:member', 'update:member',
    'view:visitors', 'create:visitor', 'read:visitor', 'update:visitor', 'convert:visitor',
    'create:zone', 'read:zone', 'update:zone', 'manage:zones',
    'read:family', 'view:families',
    'create:visitation', 'read:visitation',
    'manage:departments', 'read:department', 'view:users',
    'manage:offerings', 'view:giving-reports', 'manage:giving-goals', 'view:giving-goals',
    'manage:services', 'manage:attendance', 'view:attendance', 'view:risk-flags',
    'manage:communications', 'view:communications', 'send:communications',
    'manage:data-quality', 'view:data-quality', 'manage:attendance-analytics',
    'manage:lifecycle-rules', 'view:lifecycle-dashboard',
    'manage:files', 'read:self', 'update:self', 'create:prayer-request', 'read:own-prayer-requests',
    'view:announcements', 'publish:announcements', 'manage:invitations', 'search:members',
    'manage:events', 'view:events', 'rsvp:event',
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
    'read:self', 'update:self', 'create:prayer-request', 'read:own-prayer-requests',
    'view:giving-goals', 'view:events', 'rsvp:event',
  ],

  [UserRole.DEPARTMENT_LEADER]: [
    'read:member',
    'view:visitors', 'create:visitor', 'read:visitor',
    'read:department',
    'view:attendance',
    'view:communications',
    'view:data-quality',
    'view:lifecycle-dashboard',
    'view:families',
    'create:visitation', 'read:visitation',
    'read:self', 'update:self', 'create:prayer-request', 'read:own-prayer-requests',
    'view:giving-goals', 'view:events', 'rsvp:event',
  ],

  [UserRole.MEMBER]: [
    'read:member', // Own profile only
    'view:attendance',
    'view:communications',
    'view:lifecycle-dashboard',
    'read:self', 'update:self', 'create:prayer-request', 'read:own-prayer-requests', 'read:own-giving-history',
    'view:giving-goals', 'view:events', 'rsvp:event',
  ],
}

// ============================================================================
// PERMISSION METADATA
// ============================================================================

export interface PermissionMetadata {
  label: string
  description: string
  /** Message keys for the translated label and description; `label` and `description` stay as English fallback. */
  labelKey: MessageKey
  descriptionKey: MessageKey
  category: 'member' | 'visitor' | 'zone' | 'family' | 'visitation' | 'admin' | 'attendance'
  riskLevel: 'low' | 'medium' | 'high'
}

export const PERMISSION_METADATA: Record<PermissionAction, PermissionMetadata> = {
  'create:member': {
    labelKey: 'sweep.b.permission.createMember.label',
    descriptionKey: 'sweep.b.permission.createMember.description',
    label: 'Create Member',
    description: 'Add new members to the church',
    category: 'member',
    riskLevel: 'medium',
  },
  'read:member': {
    labelKey: 'sweep.b.permission.readMember.label',
    descriptionKey: 'sweep.b.permission.readMember.description',
    label: 'View Member',
    description: 'View member details and information',
    category: 'member',
    riskLevel: 'low',
  },
  'update:member': {
    labelKey: 'sweep.b.permission.updateMember.label',
    descriptionKey: 'sweep.b.permission.updateMember.description',
    label: 'Edit Member',
    description: 'Update member information',
    category: 'member',
    riskLevel: 'medium',
  },
  'delete:member': {
    labelKey: 'sweep.b.permission.deleteMember.label',
    descriptionKey: 'sweep.b.permission.deleteMember.description',
    label: 'Delete Member',
    description: 'Delete member records',
    category: 'member',
    riskLevel: 'high',
  },
  'search:members': {
    labelKey: 'sweep.b.permission.searchMembers.label',
    descriptionKey: 'sweep.b.permission.searchMembers.description',
    label: 'Search Members',
    description: 'Find members by name or phone (no full records)',
    category: 'member',
    riskLevel: 'low',
  },
  'view:announcements': {
    labelKey: 'sweep.b.permission.viewAnnouncements.label',
    descriptionKey: 'sweep.b.permission.viewAnnouncements.description',
    label: 'View Announcements',
    description: 'Read announcements and their delivery status',
    category: 'admin',
    riskLevel: 'low',
  },
  'publish:announcements': {
    labelKey: 'sweep.b.permission.publishAnnouncements.label',
    descriptionKey: 'sweep.b.permission.publishAnnouncements.description',
    label: 'Publish Announcements',
    description: 'Create, schedule and publish announcements',
    category: 'admin',
    riskLevel: 'medium',
  },
  'approve:announcements': {
    labelKey: 'sweep.b.permission.approveAnnouncements.label',
    descriptionKey: 'sweep.b.permission.approveAnnouncements.description',
    label: 'Approve Announcements',
    description: 'Approve another person’s announcement when approval is required',
    category: 'admin',
    riskLevel: 'medium',
  },
  'manage:invitations': {
    labelKey: 'sweep.b.permission.manageInvitations.label',
    descriptionKey: 'sweep.b.permission.manageInvitations.description',
    label: 'Manage Invitations',
    description: 'Create and revoke church join codes and approve join requests',
    category: 'member',
    riskLevel: 'medium',
  },
  'view:prayer-requests': {
    labelKey: 'sweep.b.permission.viewPrayerRequests.label',
    descriptionKey: 'sweep.b.permission.viewPrayerRequests.description',
    label: 'View Prayer Requests',
    description: 'Read prayer requests shared with pastoral staff (policy pending D-17)',
    category: 'member',
    riskLevel: 'high',
  },
  'view:visitors': {
    labelKey: 'sweep.b.permission.viewVisitors.label',
    descriptionKey: 'sweep.b.permission.viewVisitors.description',
    label: 'View Visitors',
    description: 'View visitor list and details',
    category: 'visitor',
    riskLevel: 'low',
  },
  'create:visitor': {
    labelKey: 'sweep.b.permission.createVisitor.label',
    descriptionKey: 'sweep.b.permission.createVisitor.description',
    label: 'Create Visitor',
    description: 'Add new visitor records',
    category: 'visitor',
    riskLevel: 'low',
  },
  'read:visitor': {
    labelKey: 'sweep.b.permission.readVisitor.label',
    descriptionKey: 'sweep.b.permission.readVisitor.description',
    label: 'Read Visitor',
    description: 'View visitor details',
    category: 'visitor',
    riskLevel: 'low',
  },
  'update:visitor': {
    labelKey: 'sweep.b.permission.updateVisitor.label',
    descriptionKey: 'sweep.b.permission.updateVisitor.description',
    label: 'Edit Visitor',
    description: 'Update visitor information',
    category: 'visitor',
    riskLevel: 'medium',
  },
  'delete:visitor': {
    labelKey: 'sweep.b.permission.deleteVisitor.label',
    descriptionKey: 'sweep.b.permission.deleteVisitor.description',
    label: 'Delete Visitor',
    description: 'Delete visitor records',
    category: 'visitor',
    riskLevel: 'high',
  },
  'convert:visitor': {
    labelKey: 'sweep.b.permission.convertVisitor.label',
    descriptionKey: 'sweep.b.permission.convertVisitor.description',
    label: 'Convert Visitor',
    description: 'Convert visitor to church member',
    category: 'visitor',
    riskLevel: 'medium',
  },
  'create:zone': {
    labelKey: 'sweep.b.permission.createZone.label',
    descriptionKey: 'sweep.b.permission.createZone.description',
    label: 'Create Zone',
    description: 'Create new zones/groups',
    category: 'zone',
    riskLevel: 'medium',
  },
  'read:zone': {
    labelKey: 'sweep.b.permission.readZone.label',
    descriptionKey: 'sweep.b.permission.readZone.description',
    label: 'Read Zone',
    description: 'View zone details',
    category: 'zone',
    riskLevel: 'low',
  },
  'update:zone': {
    labelKey: 'sweep.b.permission.updateZone.label',
    descriptionKey: 'sweep.b.permission.updateZone.description',
    label: 'Edit Zone',
    description: 'Update zone information',
    category: 'zone',
    riskLevel: 'medium',
  },
  'delete:zone': {
    labelKey: 'sweep.b.permission.deleteZone.label',
    descriptionKey: 'sweep.b.permission.deleteZone.description',
    label: 'Delete Zone',
    description: 'Delete zone records',
    category: 'zone',
    riskLevel: 'high',
  },
  'manage:zones': {
    labelKey: 'sweep.b.permission.manageZones.label',
    descriptionKey: 'sweep.b.permission.manageZones.description',
    label: 'Manage Zones',
    description: 'Full zone management',
    category: 'zone',
    riskLevel: 'high',
  },
  'create:family': {
    labelKey: 'sweep.b.permission.createFamily.label',
    descriptionKey: 'sweep.b.permission.createFamily.description',
    label: 'Create Family',
    description: 'Create new family records',
    category: 'family',
    riskLevel: 'low',
  },
  'read:family': {
    labelKey: 'sweep.b.permission.readFamily.label',
    descriptionKey: 'sweep.b.permission.readFamily.description',
    label: 'Read Family',
    description: 'View family details',
    category: 'family',
    riskLevel: 'low',
  },
  'update:family': {
    labelKey: 'sweep.b.permission.updateFamily.label',
    descriptionKey: 'sweep.b.permission.updateFamily.description',
    label: 'Edit Family',
    description: 'Update family information',
    category: 'family',
    riskLevel: 'low',
  },
  'delete:family': {
    labelKey: 'sweep.b.permission.deleteFamily.label',
    descriptionKey: 'sweep.b.permission.deleteFamily.description',
    label: 'Delete Family',
    description: 'Delete family records',
    category: 'family',
    riskLevel: 'high',
  },
  'manage:families': {
    labelKey: 'sweep.b.permission.manageFamilies.label',
    descriptionKey: 'sweep.b.permission.manageFamilies.description',
    label: 'Manage Families',
    description: 'Full family management',
    category: 'family',
    riskLevel: 'high',
  },
  'view:families': {
    labelKey: 'sweep.b.permission.viewFamilies.label',
    descriptionKey: 'sweep.b.permission.viewFamilies.description',
    label: 'View Families',
    description: 'View family list and details',
    category: 'family',
    riskLevel: 'low',
  },
  'create:visitation': {
    labelKey: 'sweep.b.permission.createVisitation.label',
    descriptionKey: 'sweep.b.permission.createVisitation.description',
    label: 'Create Visitation',
    description: 'Log visitation activities',
    category: 'visitation',
    riskLevel: 'low',
  },
  'read:visitation': {
    labelKey: 'sweep.b.permission.readVisitation.label',
    descriptionKey: 'sweep.b.permission.readVisitation.description',
    label: 'Read Visitation',
    description: 'View visitation records',
    category: 'visitation',
    riskLevel: 'low',
  },
  'update:visitation': {
    labelKey: 'sweep.b.permission.updateVisitation.label',
    descriptionKey: 'sweep.b.permission.updateVisitation.description',
    label: 'Update Visitation',
    description: 'Update visitation records',
    category: 'visitation',
    riskLevel: 'low',
  },
  'delete:visitation': {
    labelKey: 'sweep.b.permission.deleteVisitation.label',
    descriptionKey: 'sweep.b.permission.deleteVisitation.description',
    label: 'Delete Visitation',
    description: 'Delete visitation records',
    category: 'visitation',
    riskLevel: 'medium',
  },
  'manage:departments': {
    labelKey: 'sweep.b.permission.manageDepartments.label',
    descriptionKey: 'sweep.b.permission.manageDepartments.description',
    label: 'Manage Departments',
    description: 'Manage church departments',
    category: 'admin',
    riskLevel: 'high',
  },
  'read:department': {
    labelKey: 'sweep.b.permission.readDepartment.label',
    descriptionKey: 'sweep.b.permission.readDepartment.description',
    label: 'View Department',
    description: 'View department details and members',
    category: 'admin',
    riskLevel: 'low',
  },
  'manage:settings': {
    labelKey: 'sweep.b.permission.manageSettings.label',
    descriptionKey: 'sweep.b.permission.manageSettings.description',
    label: 'Manage Settings',
    description: 'Manage church settings and configuration',
    category: 'admin',
    riskLevel: 'high',
  },
  'manage:users': {
    labelKey: 'sweep.b.permission.manageUsers.label',
    descriptionKey: 'sweep.b.permission.manageUsers.description',
    label: 'Manage Users',
    description: 'Manage user accounts and roles',
    category: 'admin',
    riskLevel: 'high',
  },
  'manage:churches': {
    labelKey: 'sweep.b.permission.manageChurches.label',
    descriptionKey: 'sweep.b.permission.manageChurches.description',
    label: 'Manage Churches',
    description: 'Create, edit, and delete churches/branches',
    category: 'admin',
    riskLevel: 'high',
  },
  'view:users': {
    labelKey: 'sweep.b.permission.viewUsers.label',
    descriptionKey: 'sweep.b.permission.viewUsers.description',
    label: 'View Users',
    description: 'View users in church context',
    category: 'admin',
    riskLevel: 'medium',
  },
  'manage:files': {
    labelKey: 'sweep.b.permission.manageFiles.label',
    descriptionKey: 'sweep.b.permission.manageFiles.description',
    label: 'Manage Files',
    description: 'Upload and manage files/documents',
    category: 'admin',
    riskLevel: 'medium',
  },
  'manage:mail': {
    labelKey: 'sweep.b.permission.manageMail.label',
    descriptionKey: 'sweep.b.permission.manageMail.description',
    label: 'Manage Mail',
    description: 'Trigger email workflows',
    category: 'admin',
    riskLevel: 'high',
  },
  'manage:sms': {
    labelKey: 'sweep.b.permission.manageSms.label',
    descriptionKey: 'sweep.b.permission.manageSms.description',
    label: 'Manage SMS',
    description: 'Trigger SMS notifications',
    category: 'admin',
    riskLevel: 'high',
  },
  'manage:services': {
    labelKey: 'sweep.b.permission.manageServices.label',
    descriptionKey: 'sweep.b.permission.manageServices.description',
    label: 'Manage Services',
    description: 'Create and manage service types and sessions',
    category: 'attendance',
    riskLevel: 'medium',
  },
  'manage:attendance': {
    labelKey: 'sweep.b.permission.manageAttendance.label',
    descriptionKey: 'sweep.b.permission.manageAttendance.description',
    label: 'Manage Attendance',
    description: 'Submit headcount and run check-ins',
    category: 'attendance',
    riskLevel: 'medium',
  },
  'view:attendance': {
    labelKey: 'sweep.b.permission.viewAttendance.label',
    descriptionKey: 'sweep.b.permission.viewAttendance.description',
    label: 'View Attendance',
    description: 'View attendance sessions and trend reports',
    category: 'attendance',
    riskLevel: 'low',
  },
  'manage:risk-settings': {
    labelKey: 'sweep.b.permission.manageRiskSettings.label',
    descriptionKey: 'sweep.b.permission.manageRiskSettings.description',
    label: 'Manage Risk Settings',
    description: 'Configure at-risk attendance thresholds',
    category: 'attendance',
    riskLevel: 'high',
  },
  'view:risk-flags': {
    labelKey: 'sweep.b.permission.viewRiskFlags.label',
    descriptionKey: 'sweep.b.permission.viewRiskFlags.description',
    label: 'View Risk Flags',
    description: 'View at-risk member queue',
    category: 'attendance',
    riskLevel: 'medium',
  },
  'manage:communications': {
    labelKey: 'sweep.b.permission.manageCommunications.label',
    descriptionKey: 'sweep.b.permission.manageCommunications.description',
    label: 'Manage Communications',
    description: 'Create and manage communication templates and campaigns',
    category: 'admin',
    riskLevel: 'high',
  },
  'view:communications': {
    labelKey: 'sweep.b.permission.viewCommunications.label',
    descriptionKey: 'sweep.b.permission.viewCommunications.description',
    label: 'View Communications',
    description: 'View communication campaigns and analytics',
    category: 'admin',
    riskLevel: 'low',
  },
  'send:communications': {
    labelKey: 'sweep.b.permission.sendCommunications.label',
    descriptionKey: 'sweep.b.permission.sendCommunications.description',
    label: 'Send Communications',
    description: 'Schedule and send communication campaigns',
    category: 'admin',
    riskLevel: 'high',
  },
  'manage:data-quality': {
    labelKey: 'sweep.b.permission.manageDataQuality.label',
    descriptionKey: 'sweep.b.permission.manageDataQuality.description',
    label: 'Manage Data Quality',
    description: 'Run imports, review duplicates, and perform merges',
    category: 'admin',
    riskLevel: 'high',
  },
  'view:data-quality': {
    labelKey: 'sweep.b.permission.viewDataQuality.label',
    descriptionKey: 'sweep.b.permission.viewDataQuality.description',
    label: 'View Data Quality',
    description: 'View import history and duplicate queues',
    category: 'admin',
    riskLevel: 'low',
  },
  'manage:attendance-analytics': {
    labelKey: 'sweep.b.permission.manageAttendanceAnalytics.label',
    descriptionKey: 'sweep.b.permission.manageAttendanceAnalytics.description',
    label: 'Manage Attendance Analytics',
    description: 'Manage advanced attendance trend and cohort operations',
    category: 'attendance',
    riskLevel: 'medium',
  },
  'manage:lifecycle-rules': {
    labelKey: 'sweep.b.permission.manageLifecycleRules.label',
    descriptionKey: 'sweep.b.permission.manageLifecycleRules.description',
    label: 'Manage Lifecycle Rules',
    description: 'Manage milestone notification and lifecycle rule configuration',
    category: 'family',
    riskLevel: 'high',
  },
  'view:lifecycle-dashboard': {
    labelKey: 'sweep.b.permission.viewLifecycleDashboard.label',
    descriptionKey: 'sweep.b.permission.viewLifecycleDashboard.description',
    label: 'View Lifecycle Dashboard',
    description: 'View lifecycle milestones and family care dashboard',
    category: 'family',
    riskLevel: 'low',
  },
  'read:self': {
    labelKey: 'sweep.b.permission.readSelf.label',
    descriptionKey: 'sweep.b.permission.readSelf.description',
    label: 'Read Own Account',
    description: 'Read own user profile/account',
    category: 'admin',
    riskLevel: 'low',
  },
  'update:self': {
    labelKey: 'sweep.b.permission.updateSelf.label',
    descriptionKey: 'sweep.b.permission.updateSelf.description',
    label: 'Update Own Account',
    description: 'Update own user profile/account',
    category: 'admin',
    riskLevel: 'medium',
  },
  'create:prayer-request': {
    labelKey: 'sweep.b.permission.createPrayerRequest.label',
    descriptionKey: 'sweep.b.permission.createPrayerRequest.description',
    label: 'Create Prayer Request',
    description: 'Submit a personal prayer request',
    category: 'member',
    riskLevel: 'low',
  },
  'read:own-prayer-requests': {
    labelKey: 'sweep.b.permission.readOwnPrayerRequests.label',
    descriptionKey: 'sweep.b.permission.readOwnPrayerRequests.description',
    label: 'Read Own Prayer Requests',
    description: 'View own submitted prayer requests',
    category: 'member',
    riskLevel: 'low',
  },
  'manage:offerings': {
    labelKey: 'sweep.b.permission.manageOfferings.label',
    descriptionKey: 'sweep.b.permission.manageOfferings.description',
    label: 'Manage Offerings',
    description: 'Record, edit, and delete offerings and offering categories',
    category: 'admin',
    riskLevel: 'high',
  },
  'view:giving-reports': {
    labelKey: 'sweep.b.permission.viewGivingReports.label',
    descriptionKey: 'sweep.b.permission.viewGivingReports.description',
    label: 'View Giving Reports',
    description: 'View aggregate offering/giving reports by category and period',
    category: 'admin',
    riskLevel: 'medium',
  },
  'read:own-giving-history': {
    labelKey: 'sweep.b.permission.readOwnGivingHistory.label',
    descriptionKey: 'sweep.b.permission.readOwnGivingHistory.description',
    label: 'Read Own Giving History',
    description: 'View own submitted offering/contribution history',
    category: 'member',
    riskLevel: 'low',
  },
  'manage:giving-goals': {
    labelKey: 'sweep.b.permission.manageGivingGoals.label',
    descriptionKey: 'sweep.b.permission.manageGivingGoals.description',
    label: 'Manage Giving Goals',
    description: 'Create, edit, and delete church fundraising goals',
    category: 'admin',
    riskLevel: 'high',
  },
  'view:giving-goals': {
    labelKey: 'sweep.b.permission.viewGivingGoals.label',
    descriptionKey: 'sweep.b.permission.viewGivingGoals.description',
    label: 'View Giving Goals',
    description: 'View public fundraising goals, their progress, and donor-wall recognition',
    category: 'admin',
    riskLevel: 'low',
  },
  'manage:events': {
    labelKey: 'sweep.b.permission.manageEvents.label',
    descriptionKey: 'sweep.b.permission.manageEvents.description',
    label: 'Manage Events',
    description: 'Create, edit, cancel, and delete events; manage RSVP rosters and attendance',
    category: 'admin',
    riskLevel: 'high',
  },
  'view:events': {
    labelKey: 'sweep.b.permission.viewEvents.label',
    descriptionKey: 'sweep.b.permission.viewEvents.description',
    label: 'View Events',
    description: 'View the church event calendar',
    category: 'admin',
    riskLevel: 'low',
  },
  'rsvp:event': {
    labelKey: 'sweep.b.permission.rsvpEvent.label',
    descriptionKey: 'sweep.b.permission.rsvpEvent.description',
    label: 'RSVP to Events',
    description: 'Self-service RSVP to church events',
    category: 'member',
    riskLevel: 'low',
  },
  'manage:network-events': {
    labelKey: 'sweep.b.permission.manageNetworkEvents.label',
    descriptionKey: 'sweep.b.permission.manageNetworkEvents.description',
    label: 'Manage Network Events',
    description: 'Publish events visible across all branches, not just one church',
    category: 'admin',
    riskLevel: 'high',
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
    labelKey: 'sweep.b.permission.unknown.label',
    descriptionKey: 'sweep.b.permission.unknown.description',
    category: 'admin',
    riskLevel: 'medium',
  }
}

/**
 * Get user-friendly reason why permission is denied.
 * Pass a translator to localise it; without one the English fallback is returned.
 */
export function getPermissionDenialReason(permission: PermissionAction, role: UserRole, t?: Translate): string {
  const metadata = getPermissionMetadata(permission)
  if (t) {
    return t('final.permission.denialReason', { action: t(metadata.labelKey).toLowerCase() })
  }
  return `You don't have permission to "${metadata.label.toLowerCase()}". This action requires a higher role.`
}
