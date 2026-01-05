import { sql } from "drizzle-orm"
import {
  boolean,
  date,
  pgEnum,
  pgTable,
  uuid,
  varchar,
  index,
} from "drizzle-orm/pg-core"

export const roleEnum = pgEnum("role", [
  "super_admin",
  "admin",
  "branch_admin",
  "zone_leader",
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
    phone: varchar("phone", { length: 20 }).unique(),
    picture: varchar("picture", { length: 255 }),
    role: roleEnum("role").default("member"),
    churchId: uuid("church_id"),
    assignedZoneId: uuid("assigned_zone_id"),
    isActive: boolean("is_active").default(true),
    createdAt: date("created_at").defaultNow(),
    updatedAt: date("updated_at").defaultNow(),
    deletedAt: date("deleted_at"),
  },
  (table) => ({
    emailIdx: index("idx_users_email").on(table.email),
    phoneIdx: index("idx_users_phone").on(table.phone),
    churchIdx: index("idx_users_church").on(table.churchId),
    roleIdx: index("idx_users_role").on(table.role),
    zoneIdx: index("idx_users_zone").on(table.assignedZoneId),
  })
)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
