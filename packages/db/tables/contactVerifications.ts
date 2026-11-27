import { relations, sql } from "drizzle-orm"
import { check, index, pgTable, smallint, timestamp, uuid, varchar, char } from "drizzle-orm/pg-core"

import { users } from "./user"

// One-time codes for email and phone verification (D-04). Only the HMAC of the code is stored, never the code.
export const contactVerifications = pgTable(
  "contact_verifications",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`).notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    channel: varchar("channel", { length: 8 }).notNull(),
    destination: varchar("destination", { length: 255 }).notNull(),
    codeHmac: char("code_hmac", { length: 64 }).notNull(),
    purpose: varchar("purpose", { length: 16 }).notNull(),
    attempts: smallint("attempts").default(0).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    consumedAt: timestamp("consumed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userChannelIdx: index("idx_contact_verifications_user_channel").on(
      table.userId,
      table.channel,
      table.createdAt.desc(),
    ),
    channelCheck: check(
      "ck_contact_verifications_channel",
      sql`${table.channel} in ('email', 'phone')`,
    ),
    purposeCheck: check(
      "ck_contact_verifications_purpose",
      sql`${table.purpose} in ('signup', 'change', 'recovery')`,
    ),
  }),
)

export const contactVerificationsRelations = relations(contactVerifications, ({ one }) => ({
  user: one(users, {
    fields: [contactVerifications.userId],
    references: [users.id],
  }),
}))

export type ContactVerification = typeof contactVerifications.$inferSelect
export type NewContactVerification = typeof contactVerifications.$inferInsert
