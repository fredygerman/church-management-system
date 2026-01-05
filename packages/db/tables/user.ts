import { sql } from "drizzle-orm"
import {
  boolean,
  date,
  pgEnum,
  pgTable,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

export const roleEnum = pgEnum("role", [
  "super_admin",
  "branch_admin",
  "jumuiya_leader",
  "member",
])

export type RoleType = (typeof roleEnum.enumValues)[number]

export const users = pgTable(
  "users",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`)
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    picture: varchar("picture", { length: 255 }),
    role: roleEnum("role").default("member"),
    churchId: uuid("church_id"),
    assignedZoneId: uuid("assigned_zone_id"),
    isActive: boolean("is_active").default(true),
    createdAt: date("created_at").defaultNow(),
    updatedAt: date("updated_at").defaultNow(),
    deletedAt: date("deleted_at"),
  }
)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
