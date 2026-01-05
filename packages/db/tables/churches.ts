import { sql } from "drizzle-orm"
import { date, pgTable, text, uuid, varchar, index } from "drizzle-orm/pg-core"

export const churches = pgTable(
  "churches",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`)
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    location: varchar("location", { length: 255 }).notNull(),
    leadPastorName: varchar("lead_pastor_name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    email: varchar("email", { length: 255 }),
    description: text("description"),
    createdAt: date("created_at").defaultNow(),
    updatedAt: date("updated_at").defaultNow(),
    deletedAt: date("deleted_at"),
  },
  (table) => ({
    emailIdx: index("idx_churches_email").on(table.email),
    phoneIdx: index("idx_churches_phone").on(table.phone),
    nameIdx: index("idx_churches_name").on(table.name),
  })
)

export type Church = typeof churches.$inferSelect
export type NewChurch = typeof churches.$inferInsert
