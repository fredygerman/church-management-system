import { sql } from "drizzle-orm"
import { index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core"

import { churches } from "./churches"
import { aiConversations } from "./aiConversations"
import { users } from "./user"

// A user's rating of one assistant answer (DEC-08). Ratings only: no free text is stored.
// The answer text is kept with the rating, so the rating stays readable after the conversation is purged. Deleting the
// conversation cascades here, so feedback also expires after 30 days.
export const aiFeedbackRatingEnum = pgEnum("ai_feedback_rating", ["helpful", "not_helpful"])

export const aiFeedback = pgTable(
  "ai_feedback",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`)
      .notNull(),
    churchId: uuid("church_id")
      .references(() => churches.id)
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    conversationId: uuid("conversation_id")
      .references(() => aiConversations.id, { onDelete: "cascade" })
      .notNull(),
    answerId: varchar("answer_id", { length: 64 }).notNull(),
    rating: aiFeedbackRatingEnum("rating").notNull(),
    answerContent: text("answer_content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // One rating per user per answer; a second tap replaces the first.
    answerUnique: uniqueIndex("uq_ai_feedback_user_answer").on(table.userId, table.conversationId, table.answerId),
    churchIdx: index("idx_ai_feedback_church").on(table.churchId),
  })
)

export type AiFeedback = typeof aiFeedback.$inferSelect
export type NewAiFeedback = typeof aiFeedback.$inferInsert
