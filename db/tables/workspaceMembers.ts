import { pgTable, uuid } from "drizzle-orm/pg-core"

import { members } from "./members"
import { workspaces } from "./workspace"

const workspaceMembers = pgTable("workspace_members", {
  workspaceId: uuid("workspace_id")
    .references(() => workspaces.id)
    .notNull(),
  memberId: uuid("member_id")
    .references(() => members.id)
    .notNull(),
})

export { workspaceMembers }
