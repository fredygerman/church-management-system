import type { Config } from 'drizzle-kit';
import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Build database URL from environment variables
const databaseURL =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER || 'church_user'}:${process.env.DB_PASSWORD || 'church_password'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'church__dev'}`;

export default defineConfig({
  dialect: 'postgresql',
  schema: './schema.ts',
  out: './migrations',
  dbCredentials: {
    url: databaseURL,
  },
}) as Config;
