import { sql } from 'drizzle-orm'
import { boolean, index, integer, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { churches } from './churches'
import { users } from './user'
import { members } from './members'

export const importJobStatusEnum = pgEnum('import_job_status', ['draft', 'previewed', 'committed', 'failed'])
export const importModeEnum = pgEnum('import_mode', ['create_only', 'update_only', 'create_and_update'])
export const duplicateCandidateStatusEnum = pgEnum('duplicate_candidate_status', ['pending', 'approved', 'declined', 'ignored'])

export const importJobs = pgTable('import_jobs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`).notNull(),
  churchId: uuid('church_id').references(() => churches.id).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileFormat: varchar('file_format', { length: 20 }).notNull(),
  columnMapping: text('column_mapping').default('{}').notNull(),
  mode: importModeEnum('mode').default('create_and_update').notNull(),
  status: importJobStatusEnum('status').default('draft').notNull(),
  idempotencyKey: varchar('idempotency_key', { length: 255 }),
  totalRows: integer('total_rows').default(0).notNull(),
  validRows: integer('valid_rows').default(0).notNull(),
  invalidRows: integer('invalid_rows').default(0).notNull(),
  createdCount: integer('created_count').default(0).notNull(),
  updatedCount: integer('updated_count').default(0).notNull(),
  skippedCount: integer('skipped_count').default(0).notNull(),
  summary: text('summary'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const importRows = pgTable('import_rows', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`).notNull(),
  importJobId: uuid('import_job_id').references(() => importJobs.id).notNull(),
  churchId: uuid('church_id').references(() => churches.id).notNull(),
  rowNumber: integer('row_number').notNull(),
  rawData: text('raw_data').notNull(),
  normalizedData: text('normalized_data'),
  isValid: boolean('is_valid').default(false).notNull(),
  errors: text('errors').default('[]').notNull(),
  actionTaken: varchar('action_taken', { length: 30 }),
  targetMemberId: uuid('target_member_id').references(() => members.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const duplicateCandidates = pgTable('duplicate_candidates', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`).notNull(),
  churchId: uuid('church_id').references(() => churches.id).notNull(),
  primaryMemberId: uuid('primary_member_id').references(() => members.id).notNull(),
  duplicateMemberId: uuid('duplicate_member_id').references(() => members.id).notNull(),
  confidenceScore: integer('confidence_score').default(0).notNull(),
  reason: text('reason').notNull(),
  status: duplicateCandidateStatusEnum('status').default('pending').notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  resolvedBy: uuid('resolved_by').references(() => users.id),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const mergeActions = pgTable('merge_actions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`).notNull(),
  churchId: uuid('church_id').references(() => churches.id).notNull(),
  candidateId: uuid('candidate_id').references(() => duplicateCandidates.id).notNull(),
  sourceMemberId: uuid('source_member_id').references(() => members.id).notNull(),
  targetMemberId: uuid('target_member_id').references(() => members.id).notNull(),
  mergedBy: uuid('merged_by').references(() => users.id),
  relinkSummary: text('relink_summary').default('{}').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type ImportJob = typeof importJobs.$inferSelect
export type ImportRow = typeof importRows.$inferSelect
export type DuplicateCandidate = typeof duplicateCandidates.$inferSelect
export type MergeAction = typeof mergeActions.$inferSelect
