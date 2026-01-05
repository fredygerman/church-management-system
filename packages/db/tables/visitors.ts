import { sql } from "drizzle-orm"
import { date, pgEnum, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core"

import { churches } from "./churches"

export const visitorFollowupStatusEnum = pgEnum("visitor_followup_status", [
  "none",
  "called",
  "visited",
  "converted",
  "dropped",
])

export const visitors = pgTable("visitors", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  churchId: uuid("church_id")
    .references(() => churches.id)
    .notNull(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  visitDate: date("visit_date").defaultNow(),
  createdAt: date("created_at").defaultNow(),
  updatedAt: date("updated_at").defaultNow(),
  deletedAt: date("deleted_at"),
})

export type Visitor = typeof visitors.$inferSelect
export type NewVisitor = typeof visitors.$inferInsert

export const visitorFollowups = pgTable("visitor_followups", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  visitorId: uuid("visitor_id")
    .references(() => visitors.id)
    .notNull(),
  status: visitorFollowupStatusEnum("status").default("none"),
  notes: text("notes"),
  followupDate: date("followup_date"),
  completedBy: uuid("completed_by"), // FK to User
  createdAt: date("created_at").defaultNow(),
  updatedAt: date("updated_at").defaultNow(),
  deletedAt: date("deleted_at"),
})

export type VisitorFollowup = typeof visitorFollowups.$inferSelect
export type NewVisitorFollowup = typeof visitorFollowups.$inferInsert
