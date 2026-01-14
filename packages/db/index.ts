import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

let dbInstance: ReturnType<typeof drizzle> | null = null;
let clientInstance: ReturnType<typeof postgres> | null = null;

function initDb() {
  if (!dbInstance && process.env.DATABASE_URL) {
    try {
      // Create client with connection pooling
      clientInstance = postgres(process.env.DATABASE_URL, {
        max: 20, // Maximum pool size
        idle_timeout: 30, // Close idle connections after 30 seconds
        connect_timeout: 5, // Connection timeout in seconds
        // Enable automatic reconnection
        onnotice: (notice) => {
          if (notice.message) {
            console.warn('PostgreSQL Notice:', notice.message);
          }
        },
      });

      dbInstance = drizzle(clientInstance, { schema });
      
      // Handle connection errors - postgres client doesn't have .on method
      // Connection error handling is built into the postgres client
    } catch (error) {
      console.error('Failed to initialize database:', error);
      clientInstance = null;
      dbInstance = null;
    }
  }
  return dbInstance;
}

// Graceful shutdown function
export async function closeDb() {
  if (clientInstance) {
    try {
      await clientInstance.end();
      clientInstance = null;
      dbInstance = null;
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error closing database:', error);
    }
  }
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
