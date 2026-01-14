import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { DATABASE_OPTIONS } from '../core/constants/db.constants';
import { DatabaseOptions, Database } from './interfaces/database.interfaces';
import { Pool } from 'pg';
import { NodePgDatabase, drizzle as drizzlePg } from 'drizzle-orm/node-postgres';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private _database: Database;

  constructor(
    @Inject(DATABASE_OPTIONS)
    private _databaseOptions: DatabaseOptions,
  ) {}

  async onModuleInit() {
    // Initialize database on module init
    await this.getDatabase();
  }

  async getDatabase(): Promise<Database> {
    if (!this._database) {
      const pool = new Pool({ connectionString: this._databaseOptions.url });

      // Note: Database caching is currently disabled
      // To enable caching in the future, implement a custom cache layer
      // or use Drizzle ORM's standard caching mechanism with a Redis instance
      const cacheConfig = this._databaseOptions.cache;

      this._database = drizzlePg(pool, {
        ...(this._databaseOptions.options ? this._databaseOptions.options : {}),
        ...(cacheConfig ? { cache: cacheConfig } : {}),
      });
    }
    return this._database;
  }
}
