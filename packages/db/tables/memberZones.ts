import { sql } from "drizzle-orm"
import { boolean, date, pgTable, uuid, index, uniqueIndex } from "drizzle-orm/pg-core"

import { members } from "./members"
import { zones } from "./zones"

export const memberZones = pgTable(
  "member_zones",
  {
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
  },
  (table) => ({
    uniqueMemberZone: uniqueIndex("ux_member_zone").on(table.memberId, table.zoneId),
    memberIdx: index("idx_member_zones_member").on(table.memberId),
    zoneIdx: index("idx_member_zones_zone").on(table.zoneId),
  })
)

export type MemberZone = typeof memberZones.$inferSelect
export type NewMemberZone = typeof memberZones.$inferInsert
