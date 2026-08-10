import { sql } from "drizzle-orm"
import { boolean, date, integer, pgTable, text, uuid, varchar, index } from "drizzle-orm/pg-core"

import { churches } from "./churches"

export const givingGoals = pgTable(
  "giving_goals",
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
    targetCents: integer("target_cents").notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
    isPublic: boolean("is_public").default(true).notNull(),
    createdAt: date("created_at").defaultNow(),
    updatedAt: date("updated_at").defaultNow(),
    deletedAt: date("deleted_at"),
  },
  (table) => ({
    churchIdx: index("idx_giving_goals_church").on(table.churchId),
    endDateIdx: index("idx_giving_goals_end_date").on(table.endDate),
  })
)

export type GivingGoal = typeof givingGoals.$inferSelect
export type NewGivingGoal = typeof givingGoals.$inferInsert
