import { Logger } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import * as fs from 'fs';
import * as path from 'path';
import postgres from 'postgres';

/**
 * Opt-in migrations at API startup (off unless RUN_MIGRATIONS_ON_START is exactly "true").
 * Runs inside the container network over a dedicated single connection, so no database
 * port needs to be exposed. A failure throws, so bootstrap rejects and the process exits
 * before NestJS starts serving requests against a half-migrated schema.
 * Logs never include DATABASE_URL.
 */

const JOURNAL_RELATIVE_PATH = path.join('meta', '_journal.json');

/**
 * Candidate locations for packages/db/migrations, first match wins:
 *  - production image: WORKDIR /app, compiled file lives at /app/apps/api/dist/apps/api/src/database
 *  - development from apps/api (cwd) or from the repo root
 *  - ts-node/source: apps/api/src/database
 *  - compiled output resolved relative to __dirname
 */
export function migrationsFolderCandidates(): string[] {
  return [
    path.resolve(process.cwd(), 'packages/db/migrations'),
    path.resolve(process.cwd(), '../../packages/db/migrations'),
    path.resolve(__dirname, '../../../../packages/db/migrations'),
    path.resolve(__dirname, '../../../../../../../packages/db/migrations'),
  ];
}

export function resolveMigrationsFolder(
  candidates: string[] = migrationsFolderCandidates(),
  exists: (folder: string) => boolean = (folder) =>
    fs.existsSync(path.join(folder, JOURNAL_RELATIVE_PATH)),
): string {
  for (const candidate of candidates) {
    if (exists(candidate)) {
      return candidate;
    }
  }
  throw new Error(
    `Migrations folder not found (RUN_MIGRATIONS_ON_START=true). Checked: ${candidates.join(', ')}`,
  );
}

export async function runMigrationsIfEnabled(logger: Pick<Logger, 'log'>): Promise<void> {
  if (process.env.RUN_MIGRATIONS_ON_START !== 'true') {
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('RUN_MIGRATIONS_ON_START=true but DATABASE_URL is not set');
  }

  const migrationsFolder = resolveMigrationsFolder();

  logger.log('Running database migrations on startup...');
  const startedAt = Date.now();

  const client = postgres(databaseUrl, { max: 1 });
  try {
    await migrate(drizzle(client), { migrationsFolder });
  } finally {
    await client.end();
  }

  logger.log(`Database migrations applied successfully in ${Date.now() - startedAt}ms`);
}
