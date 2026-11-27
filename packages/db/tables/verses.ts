import { relations, sql } from "drizzle-orm"
import { boolean, date, index, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core"

import { churches } from "./churches"

// Verse of the day. A church keeps its own list of verses (verse_entries); staff can take a
// verse out of rotation with `active`, and pin a verse to a specific calendar day with a row in
// verse_overrides. The built-in fallback list lives in apps/api, not in the database.

export const verseEntries = pgTable(
  "verse_entries",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`).notNull(),
    churchId: uuid("church_id")
      .references(() => churches.id)
      .notNull(),
    reference: varchar("reference", { length: 120 }).notNull(),
    textEn: text("text_en").notNull(),
    textSw: text("text_sw"),
    active: boolean("active").default(true).notNull(),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    churchActiveIdx: index("idx_verse_entries_church_active").on(table.churchId, table.active),
  }),
)

export const verseOverrides = pgTable(
  "verse_overrides",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`).notNull(),
    churchId: uuid("church_id")
      .references(() => churches.id)
      .notNull(),
    // Calendar date in Africa/Dar_es_Salaam, stored as YYYY-MM-DD.
    date: date("date", { mode: "string" }).notNull(),
    entryId: uuid("entry_id")
      .references(() => verseEntries.id, { onDelete: "cascade" })
      .notNull(),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    churchDateUnique: uniqueIndex("ux_verse_overrides_church_date").on(table.churchId, table.date),
  }),
)

export const verseEntriesRelations = relations(verseEntries, ({ many }) => ({
  overrides: many(verseOverrides),
}))

export const verseOverridesRelations = relations(verseOverrides, ({ one }) => ({
  entry: one(verseEntries, {
    fields: [verseOverrides.entryId],
    references: [verseEntries.id],
  }),
}))

export type VerseEntry = typeof verseEntries.$inferSelect
export type NewVerseEntry = typeof verseEntries.$inferInsert
export type VerseOverride = typeof verseOverrides.$inferSelect
export type NewVerseOverride = typeof verseOverrides.$inferInsert
