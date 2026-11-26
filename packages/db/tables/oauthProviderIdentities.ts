import { relations, sql } from "drizzle-orm"
import { index, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core"

import { users } from "./user"

export const oauthProviderIdentities = pgTable(
  "oauth_provider_identities",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`).notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    provider: varchar("provider", { length: 50 }).notNull(),
    providerSubject: varchar("provider_subject", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("idx_oauth_provider_identities_user").on(table.userId),
    providerSubjectUnique: uniqueIndex("ux_oauth_provider_identities_provider_subject").on(
      table.provider,
      table.providerSubject,
    ),
  }),
)

export const oauthProviderIdentitiesRelations = relations(
  oauthProviderIdentities,
  ({ one }) => ({
    user: one(users, {
      fields: [oauthProviderIdentities.userId],
      references: [users.id],
    }),
  }),
)

export type OauthProviderIdentity = typeof oauthProviderIdentities.$inferSelect
export type NewOauthProviderIdentity = typeof oauthProviderIdentities.$inferInsert
