import { sql } from "drizzle-orm"
import { date, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core"

import { churches } from "./churches"
import { zones } from "./zones"

export const jumuiyas = pgTable("jumuiyas", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  churchId: uuid("church_id")
    .references(() => churches.id)
    .notNull(),
  zoneId: uuid("zone_id")
    .references(() => zones.id)
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  leaderId: uuid("leader_id"), // FK to Member (will be added later)
  meetingDay: varchar("meeting_day", { length: 50 }),
  createdAt: date("created_at").defaultNow(),
  updatedAt: date("updated_at").defaultNow(),
  deletedAt: date("deleted_at"),
})

export type Jumuiya = typeof jumuiyas.$inferSelect
export type NewJumuiya = typeof jumuiyas.$inferInsert
