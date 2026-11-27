// Never read real .env files; each test sets the S3 env it needs.
jest.mock('dotenv', () => ({ config: jest.fn() }));

const mockSend = jest.fn();
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
  PutObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://signed.example/object'),
}));

jest.mock('@church/db', () => ({
  db: {},
  documents: {},
  documentPublicationEvents: {},
  resourceProgress: {},
  userChurchMemberships: {},
}));

jest.mock('drizzle-orm', () => ({
  and: jest.fn(),
  eq: jest.fn(),
  ilike: jest.fn(),
  isNull: jest.fn(),
}));

import { BadRequestException } from '@nestjs/common';

const S3_VARS = ['S3_ACCESS_KEY', 'S3_SECRET_KEY', 'S3_BUCKET_NAME', 'S3_REGION'];

function setEnv(overrides: Record<string, string | undefined> = {}) {
  const values: Record<string, string | undefined> = {
    S3_ACCESS_KEY: 'test-access-key',
    S3_SECRET_KEY: 'test-secret-key',
    S3_BUCKET_NAME: 'test-bucket',
    S3_REGION: undefined,
    ...overrides,
  };
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

// Fresh module registry per call so config (read at import) sees the current env.
function load() {
  jest.resetModules();
  const Nest = require('@nestjs/common');
  const { PutObjectCommand } = require('@aws-sdk/client-s3');
  const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
  const { FileUploadService } = require('./file-upload.service');
  const storage = require('./private-storage');
  return {
    Nest,
    PutObjectCommand,
    getSignedUrl,
    storage,
    service: new FileUploadService({} as any) as any,
  };
}

describe('assertValidPrivateKey', () => {
  const { assertValidPrivateKey } = require('./private-storage');

  it.each([
    'avatars/user-1/0f8c.jpg',
    'announcements/church-1/ann-2/9b1e.png',
    'documents/file.pdf',
  ])('accepts a relative key: %s', (key) => {
    expect(assertValidPrivateKey(key)).toBe(key);
  });

  it.each([
    ['empty string', ''],
    ['leading slash', '/avatars/user-1/a.jpg'],
    ['parent segment at start', '../secrets/a.pdf'],
    ['parent segment in middle', 'avatars/../../etc/passwd'],
    ['parent segment at end', 'avatars/user-1/..'],
  ])('rejects %s', (_label, key) => {
    expect(() => assertValidPrivateKey(key)).toThrow(BadRequestException);
  });

  it('rejects non-string keys', () => {
    expect(() => assertValidPrivateKey(undefined)).toThrow();
    expect(() => assertValidPrivateKey(42)).toThrow();
  });

  it('allows dots inside a segment name', () => {
    expect(assertValidPrivateKey('avatars/user..1/a.jpg')).toBe('avatars/user..1/a.jpg');
  });
});

describe('FileUploadService private storage', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    for (const key of S3_VARS) delete process.env[key];
    setEnv();
    mockSend.mockReset().mockResolvedValue({});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  describe('when storage is not configured', () => {
    it('putPrivateObject throws ServiceUnavailableException without calling the SDK', async () => {
      setEnv({ S3_BUCKET_NAME: undefined });
      const { Nest, service } = load();
      jest.spyOn(Nest.Logger.prototype, 'error').mockImplementation(() => undefined);

      const error = await service
        .putPrivateObject('avatars/user-1/a.jpg', Buffer.from('x'), 'image/jpeg')
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(Nest.ServiceUnavailableException);
      expect(error.getStatus()).toBe(503);
      expect(error.message).toBe('Storage is not configured');
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('getSignedGetUrl throws ServiceUnavailableException when credentials are missing', async () => {
      setEnv({ S3_ACCESS_KEY: undefined });
      const { Nest, service, getSignedUrl } = load();
      jest.spyOn(Nest.Logger.prototype, 'error').mockImplementation(() => undefined);

      const error = await service.getSignedGetUrl('documents/a.pdf').catch((e: unknown) => e);

      expect(error).toBeInstanceOf(Nest.ServiceUnavailableException);
      expect(error.message).toBe('Storage is not configured');
      expect(getSignedUrl).not.toHaveBeenCalled();
    });
  });

  describe('key validation through the service', () => {
    it('putPrivateObject rejects an invalid key before calling the SDK', async () => {
      const { service } = load();

      await expect(
        service.putPrivateObject('../escape.jpg', Buffer.from('x'), 'image/jpeg'),
      ).rejects.toMatchObject({ status: 400 });
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('getSignedGetUrl rejects a leading slash without presigning', async () => {
      const { service, getSignedUrl } = load();

      await expect(service.getSignedGetUrl('/documents/a.pdf')).rejects.toMatchObject({
        status: 400,
      });
      expect(getSignedUrl).not.toHaveBeenCalled();
    });
  });

  describe('success paths', () => {
    it('putPrivateObject writes without an ACL', async () => {
      const { service, PutObjectCommand } = load();

      const key = await service.putPrivateObject('avatars/user-1/a.jpg', Buffer.from('abc'), 'image/jpeg');

      expect(key).toBe('avatars/user-1/a.jpg');
      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'test-bucket',
          Key: 'avatars/user-1/a.jpg',
          ContentType: 'image/jpeg',
          ContentLength: 3,
        }),
      );
      const input = PutObjectCommand.mock.calls[0][0];
      expect(input).not.toHaveProperty('ACL');
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('getSignedGetUrl defaults to a 900 second expiry', async () => {
      const { service, getSignedUrl } = load();

      const url = await service.getSignedGetUrl('documents/a.pdf');

      expect(url).toBe('https://signed.example/object');
      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 900 },
      );
    });
  });
});
