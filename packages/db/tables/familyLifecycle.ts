import { sql } from 'drizzle-orm'
import { boolean, date, index, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { churches } from './churches'
import { families } from './families'
import { members } from './members'
import { users } from './user'

export const relationshipRoleEnum = pgEnum('relationship_role', ['head', 'spouse', 'child', 'guardian', 'other'])
export const connectionStatusEnum = pgEnum('connection_status', ['pending', 'confirmed'])
export const suggestionStatusEnum = pgEnum('suggestion_status', ['pending', 'approved', 'declined', 'ignored'])
export const milestoneTypeEnum = pgEnum('milestone_type', ['birthday', 'anniversary', 'baptism', 'custom'])
export const milestoneChannelEnum = pgEnum('milestone_channel', ['sms', 'email'])
export const milestoneNotifyTargetEnum = pgEnum('milestone_notify_target', ['member', 'family_head', 'leader', 'admin'])
export const milestoneStatusEnum = pgEnum('milestone_status', ['pending', 'notified', 'skipped'])

export const familyRelationships = pgTable('family_relationships', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`).notNull(),
  churchId: uuid('church_id').references(() => churches.id).notNull(),
  familyId: uuid('family_id').references(() => families.id).notNull(),
  memberId: uuid('member_id').references(() => members.id).notNull(),
  role: relationshipRoleEnum('role').default('other').notNull(),
  status: connectionStatusEnum('status').default('confirmed').notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const familyConnectionSuggestions = pgTable('family_connection_suggestions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`).notNull(),
  churchId: uuid('church_id').references(() => churches.id).notNull(),
  familyId: uuid('family_id').references(() => families.id),
  memberId: uuid('member_id').references(() => members.id).notNull(),
  suggestedFamilyId: uuid('suggested_family_id').references(() => families.id),
  reason: text('reason').notNull(),
  status: suggestionStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
})

export const milestoneNotificationRules = pgTable('milestone_notification_rules', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`).notNull(),
  churchId: uuid('church_id').references(() => churches.id).notNull(),
  milestoneType: milestoneTypeEnum('milestone_type').notNull(),
  customMilestoneName: varchar('custom_milestone_name', { length: 100 }),
  channel: milestoneChannelEnum('channel').notNull(),
  notifyTarget: milestoneNotifyTargetEnum('notify_target').notNull(),
  leadDays: varchar('lead_days', { length: 20 }).default('0').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const lifecycleMilestones = pgTable('lifecycle_milestones', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`).notNull(),
  churchId: uuid('church_id').references(() => churches.id).notNull(),
  memberId: uuid('member_id').references(() => members.id).notNull(),
  familyId: uuid('family_id').references(() => families.id),
  milestoneType: milestoneTypeEnum('milestone_type').notNull(),
  label: varchar('label', { length: 150 }).notNull(),
  milestoneDate: date('milestone_date').notNull(),
  status: milestoneStatusEnum('status').default('pending').notNull(),
  notificationRuleId: uuid('notification_rule_id').references(() => milestoneNotificationRules.id),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type FamilyRelationship = typeof familyRelationships.$inferSelect
export type FamilyConnectionSuggestion = typeof familyConnectionSuggestions.$inferSelect
export type MilestoneNotificationRule = typeof milestoneNotificationRules.$inferSelect
export type LifecycleMilestone = typeof lifecycleMilestones.$inferSelect
