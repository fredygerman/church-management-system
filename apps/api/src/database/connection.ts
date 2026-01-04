import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import config from '../config';
import * as schema from './schema';
import { Logger } from '@nestjs/common';

const logger = new Logger('Database');

type Database = NodePgDatabase<typeof schema> & { $client: Client };

let db: Database | null = null;
let client: Client | null = null;

export async function createDatabaseConnection() {
  try {
    if (db && client) return { db, client };
    if (!config.databaseURL) {
      logger.warn(
        '⚠️  Database URL not configured - database features will be unavailable'
      );
      return { db: null, client: null };
    }

    logger.log('Connecting to database...');
    client = new Client({ connectionString: config.databaseURL });
    await client.connect();
    db = drizzle(client, { schema });
    logger.log('✅ Database connection established');
    return { db, client };
  } catch (error) {
    logger.error(
      '❌ Failed to connect to database:',
      error instanceof Error ? error.message : String(error)
    );
    db = null;
    client = null;
    return { db: null, client: null };
  }
}

export async function closeDatabaseConnection() {
  try {
    if (client) {
      await client.end();
      client = null;
      db = null;
      logger.log('Database connection closed');
    }
  } catch (error) {
    logger.error(
      'Error closing database:',
      error instanceof Error ? error.message : String(error)
    );
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error(
      'Database not initialized. Ensure DATABASE_URL is configured.'
    );
  }
  return db;
}

export { schema };
