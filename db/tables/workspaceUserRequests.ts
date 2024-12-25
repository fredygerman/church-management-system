import { sql } from "drizzle-orm"
import { date, pgEnum, pgTable, uuid } from "drizzle-orm/pg-core"

const statusEnum = pgEnum("request_status", [
  "pending",
  "complete",
  "rejected",
  "expired",
])

const workspaceUserRequests = pgTable("workspace_user_requests", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  workspaceId: uuid("workspace_id").notNull(),
  userId: uuid("user_id").notNull(),
  status: statusEnum("status").default("pending").notNull(),
  createdAt: date("created_at").defaultNow(),
  updatedAt: date("updated_at").defaultNow(),
  expiresAt: date("expires_at")
    .default(sql`now() + interval '1 week'`)
    .notNull(),
})

export { workspaceUserRequests }
