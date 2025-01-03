import { sql } from "drizzle-orm"
import { date, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core"

const workspaces = pgTable("workspaces", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  imageUrl: varchar("image_url", { length: 255 }),
  location: varchar("location", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: date("created_at").defaultNow(),
  updatedAt: date("updated_at").defaultNow(),
  deletedAt: date("deleted_at"),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
})

export { workspaces }
