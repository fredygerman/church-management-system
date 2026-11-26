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

const SECRET_VALUE = 'super-secret-value-do-not-log';
const S3_VARS = ['S3_ACCESS_KEY', 'S3_SECRET_KEY', 'S3_BUCKET_NAME', 'S3_REGION'];

const file = {
  fieldname: 'file',
  originalname: 'handbook.pdf',
  encoding: '7bit',
  mimetype: 'application/pdf',
  size: 4,
  destination: '',
  filename: '',
  path: '',
  buffer: Buffer.from('test'),
};

// Fresh module registry per call so config (read at import) sees the current env
// and every Nest/AWS class used for assertions is the same instance as the service's.
function load() {
  jest.resetModules();
  const Nest = require('@nestjs/common');
  const { S3Client } = require('@aws-sdk/client-s3');
  const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
  const { FileUploadService } = require('./file-upload.service');
  return {
    Nest,
    S3Client,
    getSignedUrl,
    service: new FileUploadService({} as any) as any,
  };
}

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

describe('FileUploadService storage configuration', () => {
  const originalEnv = { ...process.env };
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    for (const key of S3_VARS) delete process.env[key];
    setEnv();
    mockSend.mockReset().mockResolvedValue({});
  });

  afterEach(() => {
    errorSpy?.mockRestore();
    process.env = { ...originalEnv };
  });

  const spyOnLoggerError = (Nest: any) =>
    jest.spyOn(Nest.Logger.prototype, 'error').mockImplementation(() => undefined);

  describe('region', () => {
    it('builds the S3Client with region "auto" by default and path-style addressing', () => {
      const { S3Client } = load();
      expect(S3Client).toHaveBeenCalledWith(
        expect.objectContaining({ region: 'auto', forcePathStyle: true }),
      );
    });

    it('builds the S3Client with S3_REGION when set (Garage)', () => {
      setEnv({ S3_REGION: 'garage' });
      const { S3Client } = load();
      expect(S3Client).toHaveBeenCalledWith(
        expect.objectContaining({ region: 'garage', forcePathStyle: true }),
      );
    });
  });

  describe('missing credentials fail fast', () => {
    it('rejects uploads with a generic 503 when S3_ACCESS_KEY is missing, without calling the SDK', async () => {
      setEnv({ S3_ACCESS_KEY: undefined, S3_SECRET_KEY: SECRET_VALUE });
      const { Nest, service } = load();

      const error = await service.uploadToS3(file).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(Nest.ServiceUnavailableException);
      expect(error.getStatus()).toBe(503);
      expect(error.message).toBe('Storage is not configured');
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('rejects deletes with a generic 503 when S3_SECRET_KEY is missing', async () => {
      setEnv({ S3_SECRET_KEY: undefined });
      const { Nest, service } = load();

      const error = await service.deleteFromS3('documents/a.pdf').catch((e: unknown) => e);

      expect(error).toBeInstanceOf(Nest.ServiceUnavailableException);
      expect(error.message).toBe('Storage is not configured');
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('rejects presigned URLs with a generic 503 when the bucket is missing', async () => {
      setEnv({ S3_BUCKET_NAME: undefined });
      const { Nest, service, getSignedUrl } = load();

      const error = await service
        .presignGetUrl('documents/a.pdf', 300)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(Nest.ServiceUnavailableException);
      expect(error.message).toBe('Storage is not configured');
      expect(getSignedUrl).not.toHaveBeenCalled();
    });

    it('logs only variable names, never secret values', async () => {
      setEnv({ S3_ACCESS_KEY: undefined, S3_SECRET_KEY: SECRET_VALUE });
      const { Nest, service } = load();
      errorSpy = spyOnLoggerError(Nest);

      await service.uploadToS3(file).catch(() => undefined);

      const logged = JSON.stringify(errorSpy.mock.calls);
      expect(logged).toContain('S3_ACCESS_KEY');
      expect(logged).not.toContain(SECRET_VALUE);
      expect(logged).not.toContain('test-bucket');
    });
  });

  describe('SDK failures do not leak internal messages', () => {
    it('returns a generic upload error when the SDK throws', async () => {
      mockSend.mockRejectedValueOnce(new Error('internal endpoint 10.0.0.5 refused'));
      const { Nest, service } = load();
      errorSpy = spyOnLoggerError(Nest);

      const error = await service.uploadToS3(file).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(Nest.BadRequestException);
      expect(error.message).toBe('File upload failed');
      expect(JSON.stringify(error.getResponse())).not.toContain('10.0.0.5');
    });

    it('returns a generic 503 when presigning fails', async () => {
      const { Nest, service, getSignedUrl } = load();
      getSignedUrl.mockRejectedValueOnce(
        new Error('Resolved credential object is not valid'),
      );
      errorSpy = spyOnLoggerError(Nest);

      const error = await service
        .presignGetUrl('documents/a.pdf', 300)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(Nest.ServiceUnavailableException);
      expect(error.message).toBe('Storage is unavailable');
      expect(JSON.stringify(error.getResponse())).not.toContain('credential');
    });
  });

  describe('configured storage', () => {
    it('uploads when credentials are present', async () => {
      const { service } = load();
      await expect(service.uploadToS3(file)).resolves.toMatchObject({ success: true });
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('presigns with the configured client', async () => {
      setEnv({ S3_REGION: 'garage' });
      const { service, getSignedUrl } = load();

      await expect(service.presignGetUrl('documents/a.pdf', 300)).resolves.toBe(
        'https://signed.example/object',
      );
      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 300 },
      );
    });
  });
});
