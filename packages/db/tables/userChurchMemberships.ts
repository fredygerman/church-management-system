import { relations, sql } from "drizzle-orm"
import {
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core"

import { churches } from "./churches"
import { members } from "./members"
import { roleEnum } from "./user"
import { users } from "./user"
import { zones } from "./zones"

export const membershipStatusEnum = pgEnum("membership_status", [
  "active",
  "invited",
  "suspended",
])

export type MembershipStatusType = (typeof membershipStatusEnum.enumValues)[number]

export const userChurchMemberships = pgTable(
  "user_church_memberships",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`)
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    churchId: uuid("church_id")
      .references(() => churches.id)
      .notNull(),
    memberId: uuid("member_id").references(() => members.id),
    role: roleEnum("role").default("member").notNull(),
    assignedZoneId: uuid("assigned_zone_id").references(() => zones.id),
    status: membershipStatusEnum("status").default("active").notNull(),
    isDefaultChurch: boolean("is_default_church").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    userIdx: index("idx_user_church_memberships_user").on(table.userId),
    churchIdx: index("idx_user_church_memberships_church").on(table.churchId),
    memberIdx: index("idx_user_church_memberships_member").on(table.memberId),
    zoneIdx: index("idx_user_church_memberships_zone").on(table.assignedZoneId),
    statusIdx: index("idx_user_church_memberships_status").on(table.status),
    activeMembershipUnique: uniqueIndex("ux_user_church_memberships_active_user_church")
      .on(table.userId, table.churchId)
      .where(sql`${table.deletedAt} IS NULL`),
    defaultChurchUnique: uniqueIndex("ux_user_church_memberships_default_user")
      .on(table.userId)
      .where(sql`${table.isDefaultChurch} = true AND ${table.deletedAt} IS NULL`),
  })
)

export const userChurchMembershipRoleEvents = pgTable(
  "user_church_membership_role_events",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`)
      .notNull(),
    membershipId: uuid("membership_id")
      .references(() => userChurchMemberships.id)
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    churchId: uuid("church_id")
      .references(() => churches.id)
      .notNull(),
    previousRole: roleEnum("previous_role"),
    nextRole: roleEnum("next_role").notNull(),
    changedBy: uuid("changed_by").references(() => users.id),
    reason: text("reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    membershipIdx: index("idx_user_church_membership_role_events_membership").on(table.membershipId),
    userIdx: index("idx_user_church_membership_role_events_user").on(table.userId),
    churchIdx: index("idx_user_church_membership_role_events_church").on(table.churchId),
    changedByIdx: index("idx_user_church_membership_role_events_changed_by").on(table.changedBy),
  })
)

export const userChurchMembershipsRelations = relations(
  userChurchMemberships,
  ({ one, many }) => ({
    user: one(users, {
      fields: [userChurchMemberships.userId],
      references: [users.id],
    }),
    church: one(churches, {
      fields: [userChurchMemberships.churchId],
      references: [churches.id],
    }),
    member: one(members, {
      fields: [userChurchMemberships.memberId],
      references: [members.id],
    }),
    assignedZone: one(zones, {
      fields: [userChurchMemberships.assignedZoneId],
      references: [zones.id],
    }),
    roleEvents: many(userChurchMembershipRoleEvents),
  })
)

export const userChurchMembershipRoleEventsRelations = relations(
  userChurchMembershipRoleEvents,
  ({ one }) => ({
    membership: one(userChurchMemberships, {
      fields: [userChurchMembershipRoleEvents.membershipId],
      references: [userChurchMemberships.id],
    }),
    user: one(users, {
      fields: [userChurchMembershipRoleEvents.userId],
      references: [users.id],
    }),
    church: one(churches, {
      fields: [userChurchMembershipRoleEvents.churchId],
      references: [churches.id],
    }),
    changedByUser: one(users, {
      fields: [userChurchMembershipRoleEvents.changedBy],
      references: [users.id],
    }),
  })
)

export type UserChurchMembership = typeof userChurchMemberships.$inferSelect
export type NewUserChurchMembership = typeof userChurchMemberships.$inferInsert
export type UserChurchMembershipRoleEvent =
  typeof userChurchMembershipRoleEvents.$inferSelect
export type NewUserChurchMembershipRoleEvent =
  typeof userChurchMembershipRoleEvents.$inferInsert
