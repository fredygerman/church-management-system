import { sql } from "drizzle-orm"
import {
  boolean,
  check,
  index,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

import { churches } from "./churches"
import { users } from "./user"

/**
 * Announcements v2 (lane 05, part A): rich body (doc_v1), audience, channels,
 * approval gate and the publish state machine. Deliveries, reads, attachments
 * and the sending engine are separate tables in later parts.
 */

export const announcementStatusEnum = pgEnum("announcement_status", [
  "draft",
  "pending_approval",
  "scheduled",
  "published",
  "cancelled",
])

export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`).notNull(),
    churchId: uuid("church_id")
      .references(() => churches.id, { onDelete: "cascade" })
      .notNull(),
    title: varchar("title", { length: 120 }).notNull(),
    summary: varchar("summary", { length: 300 }),
    // 'doc_v1' is the only format written by the API; 'plain' is reserved for legacy rows (D-03).
    bodyFormat: varchar("body_format", { length: 16 }).default("doc_v1").notNull(),
    body: jsonb("body").notNull(),
    // Subset of ['in_app','email','sms']; 'in_app' is always present (D-16).
    channels: jsonb("channels").$type<("in_app" | "email" | "sms")[]>().default(["in_app"]).notNull(),
    // { allMembers: true } or { allMembers: false, zoneIds, genders, maritalStatuses }.
    audience: jsonb("audience").$type<AnnouncementAudienceColumn>().default({ allMembers: true }).notNull(),
    smsBody: varchar("sms_body", { length: 459 }),
    status: announcementStatusEnum("status").default("draft").notNull(),
    // Stored with the last successful publish/schedule so a retried request replays instead of re-running.
    publishIdempotencyKey: varchar("publish_idempotency_key", { length: 64 }),
    createdBy: uuid("created_by").references(() => users.id),
    approvedBy: uuid("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    churchStatusIdx: index("idx_announcements_church_status").on(table.churchId, table.status),
    churchPublishedIdx: index("idx_announcements_church_published").on(table.churchId, table.publishedAt),
    churchCreatedIdx: index("idx_announcements_church_created").on(table.churchId, table.createdAt),
    bodyFormatCheck: check(
      "ck_announcements_body_format",
      sql`${table.bodyFormat} in ('plain', 'doc_v1')`,
    ),
    titleNotEmptyCheck: check(
      "ck_announcements_title_not_empty",
      sql`char_length(btrim(${table.title})) > 0`,
    ),
    channelsCheck: check(
      "ck_announcements_channels",
      sql`jsonb_typeof(${table.channels}) = 'array' and ${table.channels} @> '["in_app"]'::jsonb and ${table.channels} <@ '["in_app","email","sms"]'::jsonb`,
    ),
    audienceCheck: check(
      "ck_announcements_audience_object",
      sql`jsonb_typeof(${table.audience}) = 'object'`,
    ),
    statusTimestampsCheck: check(
      "ck_announcements_status_timestamps",
      sql`(${table.status} <> 'scheduled' or ${table.scheduledAt} is not null)
        and (${table.status} <> 'published' or ${table.publishedAt} is not null)
        and (${table.status} <> 'cancelled' or ${table.cancelledAt} is not null)`,
    ),
    approvalCheck: check(
      "ck_announcements_approval",
      sql`(${table.approvedBy} is null or ${table.approvedAt} is not null)
        and (${table.approvedBy} is null or ${table.createdBy} is null or ${table.approvedBy} <> ${table.createdBy})`,
    ),
  })
)

/**
 * Per-church announcement settings. The approval toggle (D-05) lives here because
 * the churches table has no settings column. No row means the default (off).
 */
export const announcementSettings = pgTable(
  "announcement_settings",
  {
    churchId: uuid("church_id")
      .primaryKey()
      .references(() => churches.id, { onDelete: "cascade" })
      .notNull(),
    requireApproval: boolean("require_approval").default(false).notNull(),
    updatedBy: uuid("updated_by").references(() => users.id),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  }
)

export type AnnouncementAudienceColumn = {
  allMembers: boolean
  zoneIds?: string[]
  genders?: ("male" | "female" | "others")[]
  maritalStatuses?: ("single" | "married" | "divorced" | "widowed")[]
}

export type AnnouncementStatus = (typeof announcementStatusEnum.enumValues)[number]
export type Announcement = typeof announcements.$inferSelect
export type NewAnnouncement = typeof announcements.$inferInsert
export type AnnouncementSettings = typeof announcementSettings.$inferSelect
export type NewAnnouncementSettings = typeof announcementSettings.$inferInsert
