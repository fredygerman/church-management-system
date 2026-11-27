import { sql } from "drizzle-orm"
import { check, index, integer, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core"

import { churches } from "./churches"
import { users } from "./user"

/**
 * Private files (images and PDFs) embedded in rich-text announcements.
 * Objects live in private storage; members only receive short-lived signed URLs.
 */
export const announcementAttachments = pgTable(
  "announcement_attachments",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`)
      .notNull(),
    churchId: uuid("church_id")
      .references(() => churches.id)
      .notNull(),
    uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
    kind: varchar("kind", { length: 8 }).notNull(),
    contentType: varchar("content_type", { length: 64 }).notNull(),
    originalName: varchar("original_name", { length: 255 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    storageKey: varchar("storage_key", { length: 512 }).notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    churchIdx: index("idx_announcement_attachments_church").on(table.churchId),
    kindCheck: check(
      "announcement_attachments_kind_check",
      sql`${table.kind} in ('image', 'file')`
    ),
  })
)

export type AnnouncementAttachment = typeof announcementAttachments.$inferSelect
export type NewAnnouncementAttachment = typeof announcementAttachments.$inferInsert
