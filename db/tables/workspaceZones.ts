import { pgTable, uuid } from "drizzle-orm/pg-core"

import { workspaces } from "./workspace"
import { zones } from "./zone"

export const workspaceZones = pgTable("workspace_zones", {
  workspaceId: uuid("workspace_id")
    .references(() => workspaces.id)
    .notNull(),
  zoneId: uuid("zone_id")
    .references(() => zones.id)
    .notNull(),
})
