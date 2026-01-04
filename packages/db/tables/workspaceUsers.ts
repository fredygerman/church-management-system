import { pgTable, uuid } from "drizzle-orm/pg-core"

import { users } from "./user"
import { workspaces } from "./workspace"

export const workspaceUsers = pgTable("workspace_users", {
  workspaceId: uuid("workspace_id")
    .references(() => workspaces.id)
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
})
