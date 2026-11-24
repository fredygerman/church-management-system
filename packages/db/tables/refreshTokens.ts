import { sql } from "drizzle-orm"
import { index, pgTable, timestamp, uuid } from "drizzle-orm/pg-core"

import { users } from "./user"

// One row per issued refresh token. `id` is the token's jti; the token string
// itself is never stored. A family groups every token descended from one login.
export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`)
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    familyId: uuid("family_id").notNull(),
    usedAt: timestamp("used_at"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("idx_refresh_tokens_user").on(table.userId),
    familyIdx: index("idx_refresh_tokens_family").on(table.familyId),
  })
)

export type RefreshToken = typeof refreshTokens.$inferSelect
export type NewRefreshToken = typeof refreshTokens.$inferInsert
