import { db, zones } from "@church/db"

// Function to get all zones
export async function getZones(): Promise<(typeof zones.$inferSelect)[]> {
  const zoneList = await db.select().from(zones).execute()
  return zoneList
}
