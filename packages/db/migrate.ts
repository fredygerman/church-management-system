import { config } from "dotenv"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import path from "path"
import fs from "fs"

import { db } from "."

// Load environment variables from .env file
// Try multiple paths in order of preference
const envPaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../../../.env"),
]

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    console.log(`📖 Loading .env from: ${envPath}`)
    config({ path: envPath })
    break
  }
}

export async function runMigrate() {
  console.log("⏳ Running migrations...")
  console.log("DATABASE_URL:", process.env.DATABASE_URL ? "✓ Set" : "✗ Not set")

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set")
  }

  const start = Date.now()

  await migrate(db, { migrationsFolder: path.resolve(__dirname, "migrations") })

  const end = Date.now()

  console.log(`✅ Migrations completed in ${end - start}ms`)

  process.exit(0)
}

runMigrate().catch((err) => {
  console.error("❌ Migration failed")
  console.error(err)
  process.exit(1)
})
