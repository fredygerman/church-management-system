import { db } from "@/db"

import { zones } from "../tables/zones"

export async function seedZones(workspaceId: string) {
  const zoneData = [
    {
      name: "Zone 1",
      leader: "Leader 1",
      description: "Description 1",
      workspaceId,
    },
    {
      name: "Zone 2",
      leader: "Leader 2",
      description: "Description 2",
      workspaceId,
    },
    // Add more zones as needed
  ]

  for (const zone of zoneData) {
    await db.insert(zones).values(zone)
  }

  console.log("✅ Zones seeded")
}
