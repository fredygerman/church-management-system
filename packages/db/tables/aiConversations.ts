import { sql } from "drizzle-orm"
import { index, jsonb, pgTable, timestamp, uuid } from "drizzle-orm/pg-core"

import { churches } from "./churches"
import { users } from "./user"

// One AI chat conversation, owned by one user in one church (DEC-08).
// `messages` holds at most the stored turns: { role, content } where assistant
// content is the JSON of the components returned. Rows expire 30 days after
// creation and are purged lazily by the API.
// `id` is set on assistant turns only: the answer's stable id, used by feedback (ai_feedback).
export type AiStoredMessage = { role: "user" | "assistant"; content: string; id?: string }

export const aiConversations = pgTable(
  "ai_conversations",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`)
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    churchId: uuid("church_id")
      .references(() => churches.id)
      .notNull(),
    messages: jsonb("messages").$type<AiStoredMessage[]>().default(sql`'[]'::jsonb`).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at")
      .default(sql`now() + interval '30 days'`)
      .notNull(),
  },
  (table) => ({
    ownerIdx: index("idx_ai_conversations_owner").on(table.userId, table.churchId),
    expiresIdx: index("idx_ai_conversations_expires").on(table.expiresAt),
  })
)

export type AiConversation = typeof aiConversations.$inferSelect
export type NewAiConversation = typeof aiConversations.$inferInsert
