import { sql } from 'drizzle-orm'
import { date, index, integer, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { churches } from './churches'
import { serviceSessions } from './attendance'

export const serviceCadenceEnum = pgEnum('service_cadence', ['weekly', 'biweekly', 'monthly', 'special'])
export const riskSeverityEnum = pgEnum('risk_severity', ['low', 'medium', 'high'])

export const attendanceSessionMetadata = pgTable('attendance_session_metadata', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`).notNull(),
  churchId: uuid('church_id').references(() => churches.id).notNull(),
  sessionId: uuid('session_id').references(() => serviceSessions.id).notNull(),
  cadence: serviceCadenceEnum('cadence').default('weekly').notNull(),
  tags: text('tags').default('[]').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const attendanceSnapshots = pgTable('attendance_snapshots', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`).notNull(),
  churchId: uuid('church_id').references(() => churches.id).notNull(),
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  groupBy: varchar('group_by', { length: 30 }).notNull(),
  groupValue: varchar('group_value', { length: 120 }).notNull(),
  totalCheckins: integer('total_checkins').default(0).notNull(),
  uniqueMembers: integer('unique_members').default(0).notNull(),
  sessionCount: integer('session_count').default(0).notNull(),
  averagePerSession: integer('average_per_session').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const attendanceRiskProfiles = pgTable('attendance_risk_profiles', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`).notNull(),
  churchId: uuid('church_id').references(() => churches.id).notNull(),
  versionLabel: varchar('version_label', { length: 60 }).default('v1').notNull(),
  missedWeight: integer('missed_weight').default(70).notNull(),
  recencyWeight: integer('recency_weight').default(30).notNull(),
  lowThreshold: integer('low_threshold').default(30).notNull(),
  mediumThreshold: integer('medium_threshold').default(60).notNull(),
  highThreshold: integer('high_threshold').default(85).notNull(),
  isActive: integer('is_active').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const attendanceRiskHistory = pgTable('attendance_risk_history', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`).notNull(),
  churchId: uuid('church_id').references(() => churches.id).notNull(),
  memberId: uuid('member_id').notNull(),
  profileId: uuid('profile_id').references(() => attendanceRiskProfiles.id),
  riskScore: integer('risk_score').default(0).notNull(),
  severity: riskSeverityEnum('severity').default('low').notNull(),
  effectiveDate: date('effective_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
