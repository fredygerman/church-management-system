import { sql } from "drizzle-orm"
import { date, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core"

import { churches } from "./churches"

export const zones = pgTable("zones", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  churchId: uuid("church_id")
    .references(() => churches.id)
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  leaderId: uuid("leader_id"), // Reference to Member (leader of this zone/jumuiya)
  meetingDay: varchar("meeting_day", { length: 50 }), // e.g., "Monday", "Wednesday"
  createdAt: date("created_at").defaultNow(),
  updatedAt: date("updated_at").defaultNow(),
  deletedAt: date("deleted_at"),
})

export type Zone = typeof zones.$inferSelect
export type NewZone = typeof zones.$inferInsert
