import { sql } from "drizzle-orm"
import { index, jsonb, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core"

import { churches } from "./churches"
import { users } from "./user"

export const inboxNotifications = pgTable(
  "inbox_notifications",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`).notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    churchId: uuid("church_id").references(() => churches.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 80 }).notNull(),
    templateKey: varchar("template_key", { length: 160 }).notNull(),
    templateData: jsonb("template_data").$type<Record<string, string | number | boolean | null>>(),
    targetType: varchar("target_type", { length: 80 }),
    targetParams: jsonb("target_params").$type<Record<string, string | number | boolean | null>>(),
    sourceKey: varchar("source_key", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    readAt: timestamp("read_at"),
  },
  (table) => ({
    userCreatedIdx: index("idx_inbox_notifications_user_created").on(
      table.userId,
      table.createdAt,
    ),
    userReadIdx: index("idx_inbox_notifications_user_read").on(table.userId, table.readAt),
    churchIdx: index("idx_inbox_notifications_church").on(table.churchId),
    sourceUniqueIdx: uniqueIndex("ux_inbox_notifications_source").on(table.sourceKey),
  }),
)

export type InboxNotification = typeof inboxNotifications.$inferSelect
export type NewInboxNotification = typeof inboxNotifications.$inferInsert
