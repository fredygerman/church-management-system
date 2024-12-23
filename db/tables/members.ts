import { sql } from "drizzle-orm"
import { boolean, date, pgTable, uuid, varchar } from "drizzle-orm/pg-core"

import { workspaces } from "./workspace"
import { zones } from "./zones"

const members = pgTable("members", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  birthDate: date("birth_date").notNull(),
  gender: varchar("gender", {
    length: 6,
    enum: ["Male", "Female"],
  }).notNull(),
  maritalStatus: varchar("marital_status", {
    length: 10,
    enum: ["Married", "Single", "Divorced", "Widowed"],
  }).notNull(),
  birthPlace: varchar("birth_place", { length: 255 }),
  occupation: varchar("occupation", { length: 255 }),
  salvationDate: date("salvation_date"),
  baptismDate: date("baptism_date"),
  anointedDate: date("anointed_date"),
  joinedDate: date("joined_date").notNull(),
  holySpirit: boolean("holy_spirit").default(false),
  tribe: varchar("tribe", { length: 255 }),
  district: varchar("district", { length: 255 }),
  ward: varchar("ward", { length: 255 }),
  street: varchar("street", { length: 255 }),
  houseNumber: varchar("house_number", { length: 50 }),
  phone: varchar("phone", { length: 20 }),
  zoneId: uuid("zone_id").references(() => zones.id),
  landmark: varchar("landmark", { length: 255 }),
  emergencyContact1Name: varchar("emergency_contact_1_name", {
    length: 255,
  }),
  emergencyContact1Relation: varchar("emergency_contact_1_relation", {
    length: 255,
  }),
  emergencyContact1Phone: varchar("emergency_contact_1_phone", {
    length: 20,
  }),
  emergencyContact1Address: varchar("emergency_contact_1_address", {
    length: 255,
  }),
  emergencyContact2Name: varchar("emergency_contact_2_name", {
    length: 255,
  }),
  emergencyContact2Relation: varchar("emergency_contact_2_relation", {
    length: 255,
  }),
  emergencyContact2Phone: varchar("emergency_contact_2_phone", {
    length: 20,
  }),
  emergencyContact2Address: varchar("emergency_contact_2_address", {
    length: 255,
  }),
  workspaceId: uuid("workspace_id")
    .references(() => workspaces.id)
    .notNull(),
  createdAt: date("created_at").defaultNow(),
  updatedAt: date("updated_at").defaultNow(),
  deletedAt: date("deleted_at"),
})

export { members }
