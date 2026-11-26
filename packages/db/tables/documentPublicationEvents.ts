import { sql } from "drizzle-orm"
import { index, pgTable, timestamp, uuid } from "drizzle-orm/pg-core"

import { documents, documentPublicationStatusEnum } from "./documents"
import { users } from "./user"

export const documentPublicationEvents = pgTable(
  "document_publication_events",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`).notNull(),
    documentId: uuid("document_id")
      .references(() => documents.id, { onDelete: "cascade" })
      .notNull(),
    actorId: uuid("actor_id")
      .references(() => users.id)
      .notNull(),
    fromStatus: documentPublicationStatusEnum("from_status"),
    toStatus: documentPublicationStatusEnum("to_status").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    documentIdx: index("idx_document_publication_events_document").on(
      table.documentId,
      table.createdAt,
    ),
  }),
)

export type DocumentPublicationEvent = typeof documentPublicationEvents.$inferSelect
export type NewDocumentPublicationEvent = typeof documentPublicationEvents.$inferInsert
