import { sql } from "drizzle-orm"
import { pgEnum, pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core"

import { churches } from "./churches"
import { members } from "./members"
import { users } from "./user"

export const prayerRequestStatusEnum = pgEnum("prayer_request_status", [
  "open",
  "answered",
])

export const prayerRequests = pgTable(
  "prayer_requests",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`)
      .notNull(),
    churchId: uuid("church_id")
      .references(() => churches.id)
      .notNull(),
    memberId: uuid("member_id").references(() => members.id),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    content: text("content").notNull(),
    status: prayerRequestStatusEnum("status").default("open").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    churchIdx: index("idx_prayer_requests_church").on(table.churchId),
    memberIdx: index("idx_prayer_requests_member").on(table.memberId),
    userIdx: index("idx_prayer_requests_user").on(table.userId),
    statusIdx: index("idx_prayer_requests_status").on(table.status),
  })
)

export type PrayerRequest = typeof prayerRequests.$inferSelect
export type NewPrayerRequest = typeof prayerRequests.$inferInsert
