import { db } from "@/db"

import { zones } from "../tables/zones"

export async function seedZones(churchId: string) {
  const zoneData = [
    {
      name: "Zone 1",
      leader: "Leader 1",
      description: "Description 1",
      churchId,
    },
    {
      name: "Zone 2",
      leader: "Leader 2",
      description: "Description 2",
      churchId,
    },
    // Add more zones as needed
  ]

  for (const zone of zoneData) {
    await db.insert(zones).values(zone)
  }

  console.log("✅ Zones seeded")
}
