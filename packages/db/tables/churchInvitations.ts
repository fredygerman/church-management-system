import { sql } from "drizzle-orm"
import {
  char,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

import { churches } from "./churches"
import { users } from "./user"

/**
 * Join codes that let a signed-in user request membership in a church.
 * Only the HMAC-SHA256 of the normalised code is stored; the plaintext is
 * returned once at creation. `last_chars` is kept only for admin display.
 */
export const churchInvitations = pgTable(
  "church_invitations",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`)
      .notNull(),
    churchId: uuid("church_id")
      .references(() => churches.id)
      .notNull(),
    codeHash: char("code_hash", { length: 64 }).notNull(),
    lastChars: varchar("last_chars", { length: 4 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    maxUses: integer("max_uses").notNull(),
    uses: integer("uses").default(0).notNull(),
    revokedAt: timestamp("revoked_at"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    codeHashUnique: uniqueIndex("ux_church_invitations_code_hash").on(table.codeHash),
    churchIdx: index("idx_church_invitations_church").on(table.churchId),
    createdByIdx: index("idx_church_invitations_created_by").on(table.createdBy),
  })
)

export type ChurchInvitation = typeof churchInvitations.$inferSelect
export type NewChurchInvitation = typeof churchInvitations.$inferInsert
