import { sql } from "drizzle-orm"

import { seedMembers } from "./seeds/seedMembers"
import { getFirstWorkspaceId, seedWorkspaces } from "./seeds/seedWorkspaces"
import { seedZones } from "./seeds/seedZones"

async function clearTables() {
  console.log("🗑️  Clearing existing data...")
  await sql`DELETE FROM members`
  await sql`DELETE FROM zones`
  await sql`DELETE FROM workspaces`
  console.log("✨ Tables cleared")
}
async function runSeed() {
  console.log("⏳ Running seed...")

  const start = Date.now()

  await clearTables()
  await seedWorkspaces()
  const workspaceId = await getFirstWorkspaceId() // Fetch the first workspace ID
  await seedZones(workspaceId) // Pass workspaceId to seedZones
  await seedMembers(workspaceId) // Pass workspaceId to seedMembers

  const end = Date.now()

  console.log(`✅ Seed completed in ${end - start}ms`)

  process.exit(0)
}

runSeed().catch((err) => {
  console.error("❌ Seed failed")
  console.error(err)
  process.exit(1)
})
