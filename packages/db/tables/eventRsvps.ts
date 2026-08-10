import { sql } from "drizzle-orm"
import { boolean, index, pgEnum, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core"

import { churches } from "./churches"
import { events } from "./events"
import { members } from "./members"

export const eventRsvpStatusEnum = pgEnum("event_rsvp_status", ["going", "maybe", "declined"])

export const eventRsvps = pgTable(
  "event_rsvps",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`)
      .notNull(),
    eventId: uuid("event_id")
      .references(() => events.id, { onDelete: "cascade" })
      .notNull(),
    memberId: uuid("member_id")
      .references(() => members.id, { onDelete: "cascade" })
      .notNull(),
    churchId: uuid("church_id")
      .references(() => churches.id, { onDelete: "cascade" })
      .notNull(),
    status: eventRsvpStatusEnum("status").notNull(),
    attended: boolean("attended").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    uniqueEventMember: uniqueIndex("ux_event_rsvps_event_member").on(table.eventId, table.memberId),
    eventIdx: index("idx_event_rsvps_event").on(table.eventId),
    memberIdx: index("idx_event_rsvps_member").on(table.memberId),
    churchIdx: index("idx_event_rsvps_church").on(table.churchId),
  })
)

export type EventRsvp = typeof eventRsvps.$inferSelect
export type NewEventRsvp = typeof eventRsvps.$inferInsert
