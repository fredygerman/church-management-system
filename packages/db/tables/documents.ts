import { sql } from "drizzle-orm"
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

import { churches } from "./churches"
import { users } from "./user"

export const documents = pgTable(
  "documents",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`)
      .notNull(),
    churchId: uuid("church_id")
      .references(() => churches.id)
      .notNull(),
    uploadedBy: uuid("uploaded_by")
      .references(() => users.id)
      .notNull(),
    originalFileName: varchar("original_file_name", { length: 255 }).notNull(),
    contentType: varchar("content_type", { length: 255 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    storageKey: text("storage_key").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    visibleToMembers: boolean("visible_to_members").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    churchIdx: index("idx_documents_church").on(table.churchId),
    churchVisibilityIdx: index("idx_documents_church_visibility").on(
      table.churchId,
      table.visibleToMembers,
      table.deletedAt
    ),
    uploadedByIdx: index("idx_documents_uploaded_by").on(table.uploadedBy),
  })
)

export type Document = typeof documents.$inferSelect
export type NewDocument = typeof documents.$inferInsert
