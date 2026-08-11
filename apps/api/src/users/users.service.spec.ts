/**
 * users.service.ts sources its tables via '../database/schema' (a
 * re-export of @church/db) and gets its query builder through
 * DatabaseService.getDatabase() rather than importing `db` directly, so
 * it needs a different mock shape than the jest.mock('@church/db')
 * pattern used by visitors.service.spec.ts / events.service.spec.ts.
 * This fakes '../database/schema' with column-ref objects (same
 * approach, different source module) and a minimal update/select chain
 * on the fake db - just enough for the methods under test. Extend the
 * chain (insert, innerJoin, etc.) if a future test needs it.
 */
jest.mock('drizzle-orm', () => ({
  eq: (column: string, value: any) => (row: any) => row[column] === value,
  and: (...preds: any[]) => (row: any) => preds.filter(Boolean).every((p) => p(row)),
  ne: (column: string, value: any) => (row: any) => row[column] !== value,
  isNull: (column: string) => (row: any) => row[column] == null,
}));

jest.mock('../database/schema', () => {
  const makeColumnRef = (keys: string[]) => {
    const ref: Record<string, string> = {};
    for (const key of keys) ref[key] = key;
    return ref;
  };

  return {
    users: makeColumnRef(['id', 'email', 'name', 'phone', 'picture', 'isActive', 'role', 'churchId', 'createdAt', 'updatedAt', 'deletedAt']),
    userChurchMemberships: makeColumnRef(['id', 'userId', 'churchId', 'memberId', 'role', 'assignedZoneId', 'status', 'isDefaultChurch', 'deletedAt']),
    userChurchMembershipRoleEvents: makeColumnRef(['id', 'membershipId', 'userId', 'churchId', 'previousRole', 'nextRole', 'changedBy', 'reason']),
  };
});

import { UsersService } from './users.service';
import { NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { FileUploadService } from '../file-upload/file-upload.service';

function makeFakeDb(seedUsers: any[]) {
  let store = seedUsers.map((u) => ({ ...u }));

  const update = (_table: any) => ({
    set: (data: any) => ({
      where: (predicate: any) => ({
        returning: async () => {
          const matched = store.filter(predicate);
          store = store.map((row) => (predicate(row) ? { ...row, ...data } : row));
          return matched.map((row) => ({ ...row, ...data }));
        },
      }),
    }),
  });

  const select = (_columns?: any) => ({
    from: (_table: any) => ({
      where: (predicate: any) => ({
        limit: async (n: number) => store.filter(predicate).slice(0, n),
      }),
    }),
  });

  return {
    update,
    select,
    __rows: () => store,
  };
}

describe('UsersService', () => {
  const CHURCH_A = 'church-a';
  const CHURCH_B = 'church-b';
  const USER_ID = 'user-1';

  function setup(seedUsers: any[]) {
    const fakeDb = makeFakeDb(seedUsers);
    const databaseService = { getDatabase: async () => fakeDb } as unknown as DatabaseService;
    const fileUploadService = {} as unknown as FileUploadService;
    const service = new UsersService(databaseService, fileUploadService);
    return { service, fakeDb };
  }

  describe('deleteUser', () => {
    it('soft-deletes a user that belongs to the given church', async () => {
      const { service, fakeDb } = setup([{ id: USER_ID, churchId: CHURCH_A, deletedAt: null }]);
      await service.onModuleInit();

      await service.deleteUser(USER_ID, CHURCH_A);

      expect(fakeDb.__rows()[0].deletedAt).not.toBeNull();
    });

    it('rejects deleting a user that belongs to a different church', async () => {
      const { service, fakeDb } = setup([{ id: USER_ID, churchId: CHURCH_A, deletedAt: null }]);
      await service.onModuleInit();

      await expect(service.deleteUser(USER_ID, CHURCH_B)).rejects.toThrow(NotFoundException);
      expect(fakeDb.__rows()[0].deletedAt).toBeNull();
    });
  });

  describe('restoreUser', () => {
    const deletedAt = '2026-01-01T00:00:00.000Z';

    it('restores a soft-deleted user that belongs to the given church', async () => {
      const { service, fakeDb } = setup([{ id: USER_ID, churchId: CHURCH_A, deletedAt }]);
      await service.onModuleInit();

      const result = await service.restoreUser(USER_ID, CHURCH_A);

      expect(result.deletedAt).toBeNull();
      expect(fakeDb.__rows()[0].deletedAt).toBeNull();
    });

    it('rejects restoring a user that belongs to a different church', async () => {
      const { service, fakeDb } = setup([{ id: USER_ID, churchId: CHURCH_A, deletedAt }]);
      await service.onModuleInit();

      await expect(service.restoreUser(USER_ID, CHURCH_B)).rejects.toThrow(NotFoundException);
      expect(fakeDb.__rows()[0].deletedAt).toBe(deletedAt);
    });
  });
});
