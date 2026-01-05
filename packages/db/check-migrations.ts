import { config } from "dotenv"
import path from "path"
import postgres from "postgres"

// Load environment variables
config({ path: path.resolve(__dirname, "../../.env") })

async function checkMigrations() {
  const sql = postgres(process.env.DATABASE_URL!)
  
  try {
    console.log("📋 Checking applied migrations...")
    const migrations = await sql`
      SELECT * FROM drizzle.__drizzle_migrations ORDER BY id
    `
    
    console.log("\nApplied migrations:")
    for (const migration of migrations) {
      console.log(`  - ${migration.hash}: ${migration.created_at}`)
    }
    
    process.exit(0)
  } catch (error) {
    console.error("Error:", error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

checkMigrations()
