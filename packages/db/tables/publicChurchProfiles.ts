import { sql } from "drizzle-orm"
import { index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core"

import { churches } from "./churches"

export const publicChurchProfiles = pgTable(
  "public_church_profiles",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`).notNull(),
    churchId: uuid("church_id")
      .references(() => churches.id, { onDelete: "cascade" })
      .notNull()
      .unique(),
    publicId: varchar("public_id", { length: 120 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    location: varchar("location", { length: 255 }),
    contactPhone: varchar("contact_phone", { length: 20 }),
    contactEmail: varchar("contact_email", { length: 255 }),
    about: text("about"),
    imageUrl: varchar("image_url", { length: 2048 }),
    publishedAt: timestamp("published_at"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    publishedIdx: index("idx_public_church_profiles_published").on(
      table.publishedAt,
      table.deletedAt,
    ),
  }),
)

export type PublicChurchProfile = typeof publicChurchProfiles.$inferSelect
export type NewPublicChurchProfile = typeof publicChurchProfiles.$inferInsert
