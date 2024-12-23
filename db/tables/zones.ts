import { sql } from "drizzle-orm"
import { date, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core"

import { workspaces } from "./workspace"

export const zones = pgTable("zones", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  leader: varchar("leader", { length: 255 }).notNull(),
  description: text("description"),
  workspaceId: uuid("workspace_id")
    .references(() => workspaces.id)
    .notNull(),
  createdAt: date("created_at").defaultNow(),
  updatedAt: date("updated_at").defaultNow(),
  deletedAt: date("deleted_at"),
})

export type Zone = typeof zones.$inferSelect
