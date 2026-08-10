import { sql } from "drizzle-orm"
import { date, pgTable, text, uuid, varchar, index } from "drizzle-orm/pg-core"

import { churches } from "./churches"

export const offeringCategories = pgTable(
  "offering_categories",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`)
      .notNull(),
    churchId: uuid("church_id")
      .references(() => churches.id)
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    createdAt: date("created_at").defaultNow(),
    updatedAt: date("updated_at").defaultNow(),
    deletedAt: date("deleted_at"),
  },
  (table) => ({
    churchIdx: index("idx_offering_categories_church").on(table.churchId),
    nameIdx: index("idx_offering_categories_name").on(table.name),
  })
)

export type OfferingCategory = typeof offeringCategories.$inferSelect
export type NewOfferingCategory = typeof offeringCategories.$inferInsert
