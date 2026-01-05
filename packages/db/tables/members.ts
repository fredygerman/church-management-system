import { sql } from "drizzle-orm"
import { date, pgEnum, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core"

import { churches } from "./churches"
import { zones } from "./zones"

export const baptismStatusEnum = pgEnum("baptism_status", [
  "none",
  "maji",
  "roho_mtakatifu",
  "both",
])

export const memberGenderEnum = pgEnum("member_gender", ["male", "female", "others"])

export const memberMaritalStatusEnum = pgEnum("member_marital_status", [
  "single",
  "married",
  "divorced",
  "widowed",
])

export const members = pgTable("members", {
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
  dateOfBirth: date("date_of_birth").notNull(),
  gender: memberGenderEnum("gender").notNull(),
  occupation: varchar("occupation", { length: 255 }),
  dateOfSalvation: date("date_of_salvation"),
  baptismStatus: baptismStatusEnum("baptism_status").default("none"),
  maritalStatus: memberMaritalStatusEnum("marital_status").notNull(),
  familyId: uuid("family_id"),
  notes: text("notes"),
  createdAt: date("created_at").defaultNow(),
  updatedAt: date("updated_at").defaultNow(),
  deletedAt: date("deleted_at"),
})

export type Member = typeof members.$inferSelect
export type NewMember = typeof members.$inferInsert
