import { sql } from "drizzle-orm"
import { boolean, date, integer, pgTable, text, uuid, varchar, index } from "drizzle-orm/pg-core"

import { churches } from "./churches"
import { members } from "./members"
import { offeringCategories } from "./offeringCategories"
import { serviceSessions } from "./attendance"
import { givingGoals } from "./givingGoals"

export const offerings = pgTable(
  "offerings",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`)
      .notNull(),
    churchId: uuid("church_id")
      .references(() => churches.id)
      .notNull(),
    categoryId: uuid("category_id")
      .references(() => offeringCategories.id)
      .notNull(),
    memberId: uuid("member_id").references(() => members.id),
    sessionId: uuid("session_id").references(() => serviceSessions.id),
    amountCents: integer("amount_cents").notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    offeringDate: date("offering_date").notNull(),
    note: text("note"),
    goalId: uuid("goal_id").references(() => givingGoals.id),
    showOnDonorWall: boolean("show_on_donor_wall").default(false).notNull(),
    createdAt: date("created_at").defaultNow(),
    updatedAt: date("updated_at").defaultNow(),
    deletedAt: date("deleted_at"),
  },
  (table) => ({
    churchIdx: index("idx_offerings_church").on(table.churchId),
    categoryIdx: index("idx_offerings_category").on(table.categoryId),
    memberIdx: index("idx_offerings_member").on(table.memberId),
    sessionIdx: index("idx_offerings_session").on(table.sessionId),
    offeringDateIdx: index("idx_offerings_date").on(table.offeringDate),
    goalIdx: index("idx_offerings_goal").on(table.goalId),
  })
)

export type Offering = typeof offerings.$inferSelect
export type NewOffering = typeof offerings.$inferInsert
