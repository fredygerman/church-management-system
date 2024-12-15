import { sql } from "drizzle-orm"
import { date, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core"

export const zones = pgTable("zones", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  leader: varchar("leader", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: date("created_at").defaultNow(),
})
