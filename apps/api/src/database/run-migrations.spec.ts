import * as fs from 'fs';
import * as path from 'path';
import type { Logger } from '@nestjs/common';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import {
  migrationsFolderCandidates,
  resolveMigrationsFolder,
  runMigrationsIfEnabled,
} from './run-migrations';

jest.mock('postgres', () => jest.fn());
jest.mock('drizzle-orm/postgres-js', () => ({ drizzle: jest.fn() }));
jest.mock('drizzle-orm/postgres-js/migrator', () => ({ migrate: jest.fn() }));
jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return { ...actual, existsSync: jest.fn(actual.existsSync) };
});

const DB_URL = 'postgresql://user:secret-password@db.internal:5432/church';
const FOLDER = '/app/packages/db/migrations';

describe('resolveMigrationsFolder', () => {
  it('returns the first candidate whose migration journal exists', () => {
    const exists = (folder: string) => folder === '/b' || folder === '/c';
    expect(resolveMigrationsFolder(['/a', '/b', '/c'], exists)).toBe('/b');
  });

  it('throws a clear error listing every candidate when none exist', () => {
    expect(() => resolveMigrationsFolder(['/a', '/b'], () => false)).toThrow(
      /Migrations folder not found.*\/a, \/b/,
    );
  });

  it('includes the production image location among the default candidates', () => {
    const candidates = migrationsFolderCandidates();
    expect(candidates).toContain(path.resolve(process.cwd(), 'packages/db/migrations'));
    expect(candidates.every((c) => c.endsWith(path.join('packages', 'db', 'migrations')))).toBe(true);
  });
});

describe('runMigrationsIfEnabled', () => {
  const originalEnv = { ...process.env };
  let logger: { log: jest.Mock };
  let client: { end: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.RUN_MIGRATIONS_ON_START;
    process.env.DATABASE_URL = DB_URL;

    logger = { log: jest.fn() };
    client = { end: jest.fn().mockResolvedValue(undefined) };
    (postgres as unknown as jest.Mock).mockReturnValue(client);
    (drizzle as unknown as jest.Mock).mockReturnValue('db-instance');
    (migrate as unknown as jest.Mock).mockResolvedValue(undefined);

    (fs.existsSync as unknown as jest.Mock).mockImplementation((p: string) => String(p).endsWith(path.join('meta', '_journal.json')));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = originalEnv;
  });

  const run = () => runMigrationsIfEnabled(logger as unknown as Logger);

  it.each([[undefined], ['false'], ['TRUE'], ['1'], ['yes'], ['']])(
    'does nothing when RUN_MIGRATIONS_ON_START is %p',
    async (value) => {
      if (value !== undefined) process.env.RUN_MIGRATIONS_ON_START = value;

      await expect(run()).resolves.toBeUndefined();

      expect(postgres).not.toHaveBeenCalled();
      expect(migrate).not.toHaveBeenCalled();
      expect(client.end).not.toHaveBeenCalled();
      expect(logger.log).not.toHaveBeenCalled();
    },
  );

  it('runs migrations once over a single-connection client and closes it', async () => {
    process.env.RUN_MIGRATIONS_ON_START = 'true';

    await run();

    expect(postgres).toHaveBeenCalledTimes(1);
    expect(postgres).toHaveBeenCalledWith(DB_URL, { max: 1 });
    expect(drizzle).toHaveBeenCalledWith(client);
    expect(migrate).toHaveBeenCalledTimes(1);
    expect(migrate).toHaveBeenCalledWith('db-instance', { migrationsFolder: expect.stringMatching(/packages[\\/]db[\\/]migrations$/) });
    expect(client.end).toHaveBeenCalledTimes(1);
  });

  it('logs start and success with duration but never the database URL', async () => {
    process.env.RUN_MIGRATIONS_ON_START = 'true';

    await run();

    const messages = logger.log.mock.calls.map((call) => String(call[0]));
    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatch(/Running database migrations/);
    expect(messages[1]).toMatch(/applied successfully in \d+ms/);
    for (const message of messages) {
      expect(message).not.toContain('secret-password');
      expect(message).not.toContain(DB_URL);
    }
  });

  it('rethrows a migration failure and still closes the connection', async () => {
    process.env.RUN_MIGRATIONS_ON_START = 'true';
    const failure = new Error('relation "x" already exists');
    (migrate as unknown as jest.Mock).mockRejectedValue(failure);

    await expect(run()).rejects.toBe(failure);

    expect(client.end).toHaveBeenCalledTimes(1);
    expect(logger.log).toHaveBeenCalledTimes(1);
  });

  it('fails before connecting when DATABASE_URL is missing', async () => {
    process.env.RUN_MIGRATIONS_ON_START = 'true';
    delete process.env.DATABASE_URL;

    await expect(run()).rejects.toThrow(/DATABASE_URL is not set/);
    expect(postgres).not.toHaveBeenCalled();
  });

  it('fails before connecting when no migrations folder exists', async () => {
    process.env.RUN_MIGRATIONS_ON_START = 'true';
    (fs.existsSync as unknown as jest.Mock).mockReturnValue(false);

    await expect(run()).rejects.toThrow(/Migrations folder not found/);
    expect(postgres).not.toHaveBeenCalled();
    expect(migrate).not.toHaveBeenCalled();
  });
});
