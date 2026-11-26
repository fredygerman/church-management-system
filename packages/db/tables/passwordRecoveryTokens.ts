import { relations, sql } from "drizzle-orm"
import { index, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core"

import { users } from "./user"

export const passwordRecoveryTokens = pgTable(
  "password_recovery_tokens",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`).notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    consumedAt: timestamp("consumed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("idx_password_recovery_tokens_user").on(table.userId),
    expiryIdx: index("idx_password_recovery_tokens_expiry").on(table.expiresAt),
    tokenHashUnique: uniqueIndex("ux_password_recovery_tokens_hash").on(table.tokenHash),
  }),
)

export const passwordRecoveryTokensRelations = relations(
  passwordRecoveryTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [passwordRecoveryTokens.userId],
      references: [users.id],
    }),
  }),
)

export type PasswordRecoveryToken = typeof passwordRecoveryTokens.$inferSelect
export type NewPasswordRecoveryToken = typeof passwordRecoveryTokens.$inferInsert
