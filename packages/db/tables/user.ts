import { sql } from "drizzle-orm"
import {
  boolean,
  date,
  timestamp,
  smallint,
  integer,
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
  "usher",
  "publisher",
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
    emailVerifiedAt: timestamp("email_verified_at"),
    phoneE164: varchar("phone_e164", { length: 20 }).unique(),
    phoneVerifiedAt: timestamp("phone_verified_at"),
    avatarKey: varchar("avatar_key", { length: 512 }),
    avatarUpdatedAt: timestamp("avatar_updated_at"),
    failedLoginCount: smallint("failed_login_count").default(0).notNull(),
    lockedUntil: timestamp("locked_until"),
    picture: varchar("picture", { length: 255 }),
    passwordHash: varchar("password_hash", { length: 255 }),
    role: roleEnum("role").default("member"),
    churchId: uuid("church_id"),
    assignedZoneId: uuid("assigned_zone_id"),
    isActive: boolean("is_active").default(true),
    // Bumped on logout; tokens carrying an older version are rejected.
    tokenVersion: integer("token_version").notNull().default(0),
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
