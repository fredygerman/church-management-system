import { sql } from "drizzle-orm"
import { index, integer, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core"

import { documents } from "./documents"
import { users } from "./user"

export const resourceProgress = pgTable(
  "resource_progress",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`).notNull(),
    resourceId: uuid("resource_id")
      .references(() => documents.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    positionSeconds: integer("position_seconds").default(0).notNull(),
    pageNumber: integer("page_number"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    resourceUserUnique: uniqueIndex("ux_resource_progress_resource_user").on(
      table.resourceId,
      table.userId,
    ),
    userIdx: index("idx_resource_progress_user").on(table.userId),
  }),
)

export type ResourceProgress = typeof resourceProgress.$inferSelect
export type NewResourceProgress = typeof resourceProgress.$inferInsert
