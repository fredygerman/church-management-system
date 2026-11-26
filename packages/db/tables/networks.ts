import { sql } from "drizzle-orm"
import { index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core"

export const networks = pgTable(
  "networks",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    activeIdx: index("idx_networks_active").on(table.deletedAt),
  }),
)

export type Network = typeof networks.$inferSelect
export type NewNetwork = typeof networks.$inferInsert
