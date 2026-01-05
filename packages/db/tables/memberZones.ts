import { sql } from "drizzle-orm"
import { boolean, date, pgTable, uuid } from "drizzle-orm/pg-core"

import { members } from "./members"
import { zones } from "./zones"

export const memberZones = pgTable("member_zones", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  memberId: uuid("member_id")
    .references(() => members.id, { onDelete: "cascade" })
    .notNull(),
  zoneId: uuid("zone_id")
    .references(() => zones.id, { onDelete: "cascade" })
    .notNull(),
  isLeader: boolean("is_leader").default(false),
  createdAt: date("created_at").defaultNow(),
  updatedAt: date("updated_at").defaultNow(),
  deletedAt: date("deleted_at"),
})

export type MemberZone = typeof memberZones.$inferSelect
export type NewMemberZone = typeof memberZones.$inferInsert
