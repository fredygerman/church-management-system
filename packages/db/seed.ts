import { sql } from "drizzle-orm"

import { seedMembers } from "./seeds/seedMembers"
import { getFirstChurchId, seedChurches } from "./seeds/seedChurches"
import { seedZones } from "./seeds/seedZones"

async function clearTables() {
  console.log("🗑️  Clearing existing data...")
  await sql`DELETE FROM members`
  await sql`DELETE FROM zones`
  await sql`DELETE FROM churches`
  console.log("✨ Tables cleared")
}
async function runSeed() {
  console.log("⏳ Running seed...")

  const start = Date.now()

  await clearTables()
  await seedChurches()
  const churchId = await getFirstChurchId() // Fetch the first church ID
  await seedZones(churchId) // Pass churchId to seedZones
  await seedMembers(churchId) // Pass churchId to seedMembers

  const end = Date.now()

  console.log(`✅ Seed completed in ${end - start}ms`)

  process.exit(0)
}

runSeed().catch((err) => {
  console.error("❌ Seed failed")
  console.error(err)
  process.exit(1)
})
