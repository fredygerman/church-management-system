/**
 * Schema type exports from @church/db
 * This file re-exports database types for use in DTOs and application code
 * 
 * The source of truth for data structure is in @church/db package
 * These types are used to ensure type consistency across the application
 */

// Re-export all schema types from db package
export type {
  User,
  NewUser,
  Member,
  NewMember,
  Zone,
  NewZone,
  Church,
  NewChurch,
  Family,
  NewFamily,
  Visitor,
  NewVisitor,
  VisitorFollowup,
  NewVisitorFollowup,
  MemberZone,
  NewMemberZone,
  Notification,
  NewNotification,
} from '@church/db';

// Re-export tables for schema reference
export {
  users,
  members,
  zones,
  churches,
  families,
  visitors,
  visitorFollowups,
  memberZones,
  notifications,
} from '@church/db';
