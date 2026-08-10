import { sql } from "drizzle-orm"
import { index, integer, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core"

import { churches } from "./churches"

export const eventScopeEnum = pgEnum("event_scope", ["church", "network"])
export const eventStatusEnum = pgEnum("event_status", ["draft", "published", "cancelled"])

export const events = pgTable(
  "events",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`)
      .notNull(),
    churchId: uuid("church_id")
      .references(() => churches.id)
      .notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    location: varchar("location", { length: 255 }),
    startsAt: timestamp("starts_at").notNull(),
    endsAt: timestamp("ends_at"),
    scope: eventScopeEnum("scope").default("church").notNull(),
    status: eventStatusEnum("status").default("draft").notNull(),
    headcount: integer("headcount"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    churchIdx: index("idx_events_church").on(table.churchId),
    startsAtIdx: index("idx_events_starts_at").on(table.startsAt),
    statusIdx: index("idx_events_status").on(table.status),
    scopeStatusIdx: index("idx_events_scope_status").on(table.scope, table.status),
  })
)

export type Event = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert
