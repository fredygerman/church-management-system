/**
 * Avatar paths of UsersService. Uses the same fake-db approach as
 * users.service.spec.ts: '../database/schema' is replaced with column-ref
 * objects and drizzle predicates become row filters. Storage is a plain mock
 * of FileUploadService; no S3 call is made.
 */
jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  eq: (column: string, value: any) => (row: any) => row[column] === value,
  and: (...preds: any[]) => (row: any) => preds.filter(Boolean).every((p) => p(row)),
  isNull: (column: string) => (row: any) => row[column] == null,
}));

jest.mock('../database/schema', () => {
  const makeColumnRef = (keys: string[]) => {
    const ref: Record<string, string> = {};
    for (const key of keys) ref[key] = key;
    return ref;
  };

  return {
    users: makeColumnRef(['id', 'email', 'name', 'picture', 'avatarKey', 'avatarUpdatedAt', 'deletedAt']),
    userChurchMemberships: makeColumnRef(['id', 'userId', 'churchId', 'deletedAt']),
    userChurchMembershipRoleEvents: makeColumnRef(['id', 'membershipId']),
  };
});

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { DatabaseService } from '../database/database.service';
import { FileUploadService } from '../file-upload/file-upload.service';

const USER_ID = 'user-1';
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
// Minimal well-formed JPEG: SOI, SOS header, one scan byte, EOI. Metadata stripping needs real structure.
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xda, 0x00, 0x02, 0x12, 0xff, 0xd9]);
// Minimal well-formed PNG: signature, an empty IHDR-shaped chunk and IEND.
const PNG = Buffer.concat([
  PNG_SIGNATURE,
  Buffer.from([0, 0, 0, 13]), Buffer.from('IHDR', 'ascii'), Buffer.alloc(13 + 4),
  Buffer.from([0, 0, 0, 0]), Buffer.from('IEND', 'ascii'), Buffer.alloc(4),
]);

function makeFakeDb(seedUsers: any[]) {
  let store = seedUsers.map((u) => ({ ...u }));

  const update = (_table: any) => ({
    set: (data: any) => ({
      where: (predicate: any) => {
        const matched = store.filter(predicate);
        store = store.map((row) => (predicate(row) ? { ...row, ...data } : row));
        const rows = matched.map((row) => ({ ...row, ...data }));
        return Object.assign(Promise.resolve(rows), { returning: async () => rows });
      },
    }),
  });

  const select = (_columns?: any) => ({
    from: (_table: any) => ({
      where: (predicate: any) => ({
        limit: async (n: number) => store.filter(predicate).slice(0, n),
      }),
    }),
  });

  return { update, select, __rows: () => store };
}

function setup(seedUsers: any[], storage: Partial<Record<keyof FileUploadService, jest.Mock>> = {}) {
  const fakeDb = makeFakeDb(seedUsers);
  const databaseService = { getDatabase: async () => fakeDb } as unknown as DatabaseService;
  const fileUploadService = {
    putPrivateObject: jest.fn(async (key: string) => key),
    getSignedGetUrl: jest.fn(async () => 'https://signed.example/avatar'),
    deleteFromS3: jest.fn(async () => undefined),
    ...storage,
  };
  const service = new UsersService(databaseService, fileUploadService as unknown as FileUploadService);
  return { service, fakeDb, fileUploadService };
}

describe('UsersService avatar', () => {
  describe('uploadAvatar', () => {
    it('rejects a missing file with AVATAR_MISSING_FILE', async () => {
      const { service, fileUploadService } = setup([{ id: USER_ID, avatarKey: null, deletedAt: null }]);
      await service.onModuleInit();

      await expect(service.uploadAvatar(USER_ID, undefined)).rejects.toMatchObject({
        response: { code: 'AVATAR_MISSING_FILE' },
      });
      expect(fileUploadService.putPrivateObject).not.toHaveBeenCalled();
    });

    it('rejects an SVG renamed to PNG with AVATAR_TYPE_UNSUPPORTED, ignoring the claimed MIME', async () => {
      const { service, fileUploadService } = setup([{ id: USER_ID, avatarKey: null, deletedAt: null }]);
      await service.onModuleInit();
      const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>');

      const attempt = service.uploadAvatar(USER_ID, { buffer: svg, mimetype: 'image/png', size: svg.length });

      await expect(attempt).rejects.toBeInstanceOf(BadRequestException);
      await expect(attempt).rejects.toMatchObject({ response: { code: 'AVATAR_TYPE_UNSUPPORTED' } });
      expect(fileUploadService.putPrivateObject).not.toHaveBeenCalled();
    });

    it('rejects a file over 5 MB with AVATAR_TOO_LARGE', async () => {
      const { service, fileUploadService } = setup([{ id: USER_ID, avatarKey: null, deletedAt: null }]);
      await service.onModuleInit();
      const big = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(5 * 1024 * 1024)]);

      await expect(service.uploadAvatar(USER_ID, { buffer: big, mimetype: 'image/jpeg' })).rejects.toMatchObject({
        response: { code: 'AVATAR_TOO_LARGE' },
      });
      expect(fileUploadService.putPrivateObject).not.toHaveBeenCalled();
    });

    it('stores a JPEG under avatars/{userId}/{uuid}.jpg and sets avatar columns', async () => {
      const { service, fakeDb, fileUploadService } = setup([{ id: USER_ID, avatarKey: null, deletedAt: null }]);
      await service.onModuleInit();

      const result = await service.uploadAvatar(USER_ID, { buffer: JPEG, mimetype: 'image/jpeg' });

      const [key, body, contentType] = fileUploadService.putPrivateObject.mock.calls[0];
      expect(key).toMatch(new RegExp(`^avatars/${USER_ID}/[0-9a-f-]{36}\\.jpg$`));
      expect(body).toEqual(JPEG);
      expect(contentType).toBe('image/jpeg');

      const row = fakeDb.__rows()[0];
      expect(row.avatarKey).toBe(key);
      expect(row.avatarUpdatedAt).toBeInstanceOf(Date);
      expect(result.avatarUrl).toBe('https://signed.example/avatar');
      expect(fileUploadService.getSignedGetUrl).toHaveBeenCalledWith(key, 900);
      expect(result.avatarUpdatedAt).toBe(row.avatarUpdatedAt.toISOString());
      expect(fileUploadService.deleteFromS3).not.toHaveBeenCalled();
    });

    it('uses the .png extension for a PNG chosen by magic bytes', async () => {
      const { service, fileUploadService } = setup([{ id: USER_ID, avatarKey: null, deletedAt: null }]);
      await service.onModuleInit();

      await service.uploadAvatar(USER_ID, { buffer: PNG, mimetype: 'application/octet-stream' });

      const [key, , contentType] = fileUploadService.putPrivateObject.mock.calls[0];
      expect(key).toMatch(/\.png$/);
      expect(contentType).toBe('image/png');
    });

    it('deletes the previous object after the row points at the new one', async () => {
      const previous = `avatars/${USER_ID}/old.jpg`;
      const { service, fakeDb, fileUploadService } = setup([{ id: USER_ID, avatarKey: previous, deletedAt: null }]);
      await service.onModuleInit();

      await service.uploadAvatar(USER_ID, { buffer: JPEG, mimetype: 'image/jpeg' });

      const newKey = fakeDb.__rows()[0].avatarKey;
      expect(newKey).not.toBe(previous);
      expect(fileUploadService.deleteFromS3).toHaveBeenCalledTimes(1);
      expect(fileUploadService.deleteFromS3).toHaveBeenCalledWith(previous);
    });

    it('succeeds even when deleting the previous object fails, and does not leak the storage error', async () => {
      const previous = `avatars/${USER_ID}/old.jpg`;
      const { service, fakeDb } = setup([{ id: USER_ID, avatarKey: previous, deletedAt: null }], {
        deleteFromS3: jest.fn(async () => {
          throw new BadRequestException({ message: 'File deletion failed', code: 'FILE_UPLOAD_ERROR' });
        }),
      });
      await service.onModuleInit();

      const result = await service.uploadAvatar(USER_ID, { buffer: JPEG, mimetype: 'image/jpeg' });

      expect(result.avatarUrl).toBe('https://signed.example/avatar');
      expect(fakeDb.__rows()[0].avatarKey).not.toBe(previous);
    });

    it('returns avatarUrl null when signing fails, instead of failing the upload', async () => {
      const { service } = setup([{ id: USER_ID, avatarKey: null, deletedAt: null }], {
        getSignedGetUrl: jest.fn(async () => {
          throw new Error('signing unavailable');
        }),
      });
      await service.onModuleInit();

      const result = await service.uploadAvatar(USER_ID, { buffer: JPEG, mimetype: 'image/jpeg' });

      expect(result.avatarUrl).toBeNull();
    });

    it('does not update the row when storage write fails', async () => {
      const { service, fakeDb } = setup([{ id: USER_ID, avatarKey: null, deletedAt: null }], {
        putPrivateObject: jest.fn(async () => {
          throw new Error('storage down');
        }),
      });
      await service.onModuleInit();

      await expect(service.uploadAvatar(USER_ID, { buffer: JPEG, mimetype: 'image/jpeg' })).rejects.toThrow('storage down');
      expect(fakeDb.__rows()[0].avatarKey).toBeNull();
    });

    it('returns 404 for a deleted or unknown user', async () => {
      const { service, fileUploadService } = setup([{ id: USER_ID, avatarKey: null, deletedAt: '2026-01-01' }]);
      await service.onModuleInit();

      await expect(service.uploadAvatar(USER_ID, { buffer: JPEG, mimetype: 'image/jpeg' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(fileUploadService.putPrivateObject).not.toHaveBeenCalled();
    });
  });

  describe('removeAvatar', () => {
    it('clears avatar columns and deletes the stored object', async () => {
      const key = `avatars/${USER_ID}/a.jpg`;
      const { service, fakeDb, fileUploadService } = setup([
        { id: USER_ID, avatarKey: key, avatarUpdatedAt: new Date(), deletedAt: null },
      ]);
      await service.onModuleInit();

      await service.removeAvatar(USER_ID);

      const row = fakeDb.__rows()[0];
      expect(row.avatarKey).toBeNull();
      expect(row.avatarUpdatedAt).toBeNull();
      expect(fileUploadService.deleteFromS3).toHaveBeenCalledWith(key);
    });

    it('is a no-op on storage when the user has no avatar', async () => {
      const { service, fileUploadService } = setup([{ id: USER_ID, avatarKey: null, deletedAt: null }]);
      await service.onModuleInit();

      await service.removeAvatar(USER_ID);

      expect(fileUploadService.deleteFromS3).not.toHaveBeenCalled();
    });
  });

  describe('toAccountView', () => {
    it('replaces avatarKey with a signed avatarUrl and never returns the raw key', async () => {
      const key = `avatars/${USER_ID}/a.jpg`;
      const { service, fileUploadService } = setup([]);
      await service.onModuleInit();

      const view: any = await service.toAccountView({ id: USER_ID, avatarKey: key, picture: 'https://g/p.jpg' } as any);

      expect(view).not.toHaveProperty('avatarKey');
      expect(JSON.stringify(view)).not.toContain(key);
      expect(view.avatarUrl).toBe('https://signed.example/avatar');
      expect(view.picture).toBe('https://g/p.jpg');
      expect(fileUploadService.getSignedGetUrl).toHaveBeenCalledWith(key, 900);
    });

    it('returns avatarUrl null and does not sign when there is no avatar', async () => {
      const { service, fileUploadService } = setup([]);
      await service.onModuleInit();

      const view: any = await service.toAccountView({ id: USER_ID, avatarKey: null } as any);

      expect(view.avatarUrl).toBeNull();
      expect(fileUploadService.getSignedGetUrl).not.toHaveBeenCalled();
    });
  });
});
