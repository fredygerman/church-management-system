import { ModuleMetadata, Type } from '@nestjs/common';
import { DrizzleConfig } from 'drizzle-orm';
import { MigrationConfig } from 'drizzle-orm/migrator';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export type Database = NodePgDatabase<Record<string, unknown>>;

export interface DatabaseOptions {
  driver: 'node-postgres';
  url: string;
  options?: DrizzleConfig<Record<string, unknown>>;
  migrationOptions?: MigrationConfig;
  cache?: any; // Cache configuration for Drizzle
}

export interface DatabaseOptionsFactory {
  createDatabaseOptions(): Promise<DatabaseOptions> | DatabaseOptions;
}

export interface DatabaseAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[];
  useExisting?: Type<DatabaseOptionsFactory>;
  useClass?: Type<DatabaseOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<DatabaseOptions> | DatabaseOptions;
}
