import { sql } from "drizzle-orm"
import { date, pgEnum, pgTable, text, uuid, varchar, index } from "drizzle-orm/pg-core"

import { churches } from "./churches"
import { members } from "./members"

export const visitorFollowupStatusEnum = pgEnum("visitor_followup_status", [
  "none",
  "called",
  "visited",
  "converted",
  "dropped",
])

export const visitorSourceEnum = pgEnum("visitor_source", [
  "friend",
  "flyer",
  "walk_in",
  "event",
  "referral",
  "social_media",
  "other",
])

export const visitors = pgTable(
  "visitors",
  {
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
    visitorSource: visitorSourceEnum("visitor_source").default("walk_in"),
    referredByMemberId: uuid("referred_by_member_id").references(() => members.id),
    convertedToMemberId: uuid("converted_to_member_id").references(() => members.id),
    createdAt: date("created_at").defaultNow(),
    updatedAt: date("updated_at").defaultNow(),
    deletedAt: date("deleted_at"),
  },
  (table) => ({
    churchIdx: index("idx_visitors_church").on(table.churchId),
    phoneIdx: index("idx_visitors_phone").on(table.phone),
    emailIdx: index("idx_visitors_email").on(table.email),
    visitDateIdx: index("idx_visitors_visit_date").on(table.visitDate),
    sourceIdx: index("idx_visitors_source").on(table.visitorSource),
    referredByIdx: index("idx_visitors_referred_by").on(table.referredByMemberId),
  })
)

export type Visitor = typeof visitors.$inferSelect
export type NewVisitor = typeof visitors.$inferInsert

export const visitorFollowups = pgTable(
  "visitor_followups",
  {
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
  },
  (table) => ({
    visitorIdx: index("idx_followups_visitor").on(table.visitorId),
    statusIdx: index("idx_followups_status").on(table.status),
    followupDateIdx: index("idx_followups_date").on(table.followupDate),
  })
)

export type VisitorFollowup = typeof visitorFollowups.$inferSelect
export type NewVisitorFollowup = typeof visitorFollowups.$inferInsert
