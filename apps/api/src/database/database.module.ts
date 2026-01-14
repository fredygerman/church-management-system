import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { DatabaseService } from './database.service';
import {
  connectionFactory,
  createDatabaseProviders,
} from './database.provider';
import {
  DatabaseAsyncOptions,
  DatabaseOptions,
  DatabaseOptionsFactory,
} from './interfaces/database.interfaces';
import { DATABASE_OPTIONS, DATABASE_ORM } from '../core/constants/db.constants';

@Global()
@Module({})
export class DatabaseModule {
  public static forRoot(options: DatabaseOptions): DynamicModule {
    const providers = createDatabaseProviders(options);
    return {
      module: DatabaseModule,
      providers: [
        ...providers,
        DatabaseService,
        connectionFactory,
      ],
      exports: [DatabaseService, DATABASE_ORM],
    };
  }

  public static forRootAsync(options: DatabaseAsyncOptions): DynamicModule {
    const providers = [...this.createProviders(options)];
    return {
      module: DatabaseModule,
      providers: [...providers, DatabaseService, connectionFactory],
      exports: [DatabaseService, DATABASE_ORM],
    };
  }

  private static createProviders(options: DatabaseAsyncOptions): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createOptionsProvider(options)];
    }

    return [
      this.createOptionsProvider(options),
      {
        provide: options.useClass!,
        useClass: options.useClass!,
      },
    ];
  }

  private static createOptionsProvider(
    options: DatabaseAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: DATABASE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    return {
      provide: DATABASE_OPTIONS,
      useFactory: async (optionsFactory: DatabaseOptionsFactory) =>
        await optionsFactory.createDatabaseOptions(),
      inject: [options.useExisting || options.useClass!],
    };
  }
}
