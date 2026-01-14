import {
  DATABASE_ORM,
  DATABASE_OPTIONS,
} from '../core/constants/db.constants';
import { Database } from './interfaces/database.interfaces';
import { DatabaseService } from './database.service';
import { DatabaseOptions } from './interfaces/database.interfaces';

export const connectionFactory = {
  provide: DATABASE_ORM,
  useFactory: async (databaseService: DatabaseService): Promise<Database> => {
    return databaseService.getDatabase();
  },
  inject: [DatabaseService],
};

export function createDatabaseProviders(options: DatabaseOptions) {
  return [
    {
      provide: DATABASE_OPTIONS,
      useValue: options,
    },
  ];
}
