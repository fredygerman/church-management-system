import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Create a database connection only when DATABASE_URL is available
let dbInstance: ReturnType<typeof drizzle> | null = null;

function initDb() {
  if (!dbInstance && process.env.DATABASE_URL) {
    const client = postgres(process.env.DATABASE_URL);
    dbInstance = drizzle(client, { schema });
  }
  return dbInstance;
}

// For backward compatibility, export a lazy-loaded db proxy
export const db = new Proxy({} as any, {
  get: (target, prop) => {
    const instance = initDb();
    if (!instance) {
      throw new Error("Database not initialized. DATABASE_URL is not set.");
    }
    return (instance as any)[prop];
  },
});

// Export schema and utilities
export * from "./schema";
export { sql, eq, and, or, not, like, count } from "drizzle-orm";
