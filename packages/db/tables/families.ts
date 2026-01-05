import { sql } from "drizzle-orm"
import { date, pgTable, uuid, varchar, index } from "drizzle-orm/pg-core"

import { churches } from "./churches"
import { members } from "./members"

export const families = pgTable(
  "families",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`)
      .notNull(),
    churchId: uuid("church_id")
      .references(() => churches.id)
      .notNull(),
    familyName: varchar("family_name", { length: 255 }).notNull(),
    spouseId: uuid("spouse_id").references(() => members.id),
    parentId: uuid("parent_id").references(() => members.id),
    createdAt: date("created_at").defaultNow(),
    updatedAt: date("updated_at").defaultNow(),
    deletedAt: date("deleted_at"),
  },
  (table) => ({
    churchIdx: index("idx_families_church").on(table.churchId),
    spouseIdx: index("idx_families_spouse").on(table.spouseId),
    parentIdx: index("idx_families_parent").on(table.parentId),
  })
)

export type Family = typeof families.$inferSelect
export type NewFamily = typeof families.$inferInsert
