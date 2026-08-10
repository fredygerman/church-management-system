import { sql } from "drizzle-orm"
import { date, pgTable, text, uuid, varchar, index } from "drizzle-orm/pg-core"

import { churches } from "./churches"

export const departments = pgTable(
  "departments",
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
    meetingDay: varchar("meeting_day", { length: 50 }),
    createdAt: date("created_at").defaultNow(),
    updatedAt: date("updated_at").defaultNow(),
    deletedAt: date("deleted_at"),
  },
  (table) => ({
    churchIdx: index("idx_departments_church").on(table.churchId),
    nameIdx: index("idx_departments_name").on(table.name),
  })
)

export type Department = typeof departments.$inferSelect
export type NewDepartment = typeof departments.$inferInsert
