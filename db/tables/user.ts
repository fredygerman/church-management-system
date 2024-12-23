import { sql } from "drizzle-orm"
import {
  boolean,
  date,
  pgEnum,
  pgTable,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

export const roleEnum = pgEnum("role", ["admin", "user"])

export type roleEnum = (typeof rolesEnum.enumValues)[number]

export const users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", {
    length: 255,
    enum: roleEnum,
  }).default("user"),
  isActive: boolean("is_active").default(true),
  createdAt: date("created_at").defaultNow(),
  updatedAt: date("updated_at").defaultNow(),
  deletedAt: date("deleted_at"),
})
