import { relations, sql } from "drizzle-orm"
import { check, index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core"

import { users } from "./user"

// Append-only consent log (D-19). The latest row for a user, channel and purpose wins; rows are never updated or deleted.
export const contactConsents = pgTable(
  "contact_consents",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`).notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    channel: varchar("channel", { length: 8 }).notNull(),
    purpose: varchar("purpose", { length: 32 }).notNull(),
    status: varchar("status", { length: 8 }).notNull(),
    source: varchar("source", { length: 32 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userChannelPurposeIdx: index("idx_contact_consents_user_channel_purpose").on(
      table.userId,
      table.channel,
      table.purpose,
      table.createdAt.desc(),
    ),
    statusCheck: check(
      "ck_contact_consents_status",
      sql`${table.status} in ('granted', 'revoked')`,
    ),
  }),
)

export const contactConsentsRelations = relations(contactConsents, ({ one }) => ({
  user: one(users, {
    fields: [contactConsents.userId],
    references: [users.id],
  }),
}))

export type ContactConsent = typeof contactConsents.$inferSelect
export type NewContactConsent = typeof contactConsents.$inferInsert
