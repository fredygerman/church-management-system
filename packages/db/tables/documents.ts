import { sql } from "drizzle-orm"
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

import { churches } from "./churches"
import { users } from "./user"
import { networks } from "./networks"

export const documentScopeEnum = pgEnum("document_scope", ["branch", "network"])
export const documentPublicationStatusEnum = pgEnum("document_publication_status", [
  "draft",
  "review",
  "published",
  "archived",
])

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
    networkId: uuid("network_id").references(() => networks.id),
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
    scope: documentScopeEnum("scope").default("branch").notNull(),
    publicationStatus: documentPublicationStatusEnum("publication_status")
      .default("published")
      .notNull(),
    resourceType: varchar("resource_type", { length: 50 }).default("document").notNull(),
    language: varchar("language", { length: 16 }),
    authorSpeaker: varchar("author_speaker", { length: 255 }),
    categories: jsonb("categories").$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
    coverStorageKey: text("cover_storage_key"),
    durationSeconds: integer("duration_seconds"),
    pageCount: integer("page_count"),
    transcriptStorageKey: text("transcript_storage_key"),
    publishedAt: timestamp("published_at"),
    publishedBy: uuid("published_by").references(() => users.id),
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
    scopePublicationIdx: index("idx_documents_scope_publication").on(
      table.scope,
      table.publicationStatus,
      table.networkId,
      table.deletedAt,
    ),
  })
)

export type Document = typeof documents.$inferSelect
export type NewDocument = typeof documents.$inferInsert
