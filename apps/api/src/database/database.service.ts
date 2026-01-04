import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createDatabaseConnection, closeDatabaseConnection, getDatabase } from './connection';
import { Logger } from '@nestjs/common';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);

  async onModuleInit() {
    try {
      await createDatabaseConnection();
      this.logger.log('Database module initialized');
    } catch (error) {
      this.logger.error('Failed to initialize database:', error);
    }
  }

  async onModuleDestroy() {
    await closeDatabaseConnection();
  }

  getDb() {
    return getDatabase();
  }

  async testConnection(): Promise<boolean> {
    try {
      const db = getDatabase();
      await db.execute('SELECT 1' as any);
      return true;
    } catch (error) {
      this.logger.error('Connection test failed');
      return false;
    }
  }
}
