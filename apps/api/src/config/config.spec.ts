import * as path from 'path';

// Stub dotenv so the test never reads real .env files; env is controlled per test.
jest.mock('dotenv', () => ({ config: jest.fn() }));
import * as dotenv from 'dotenv';

const ENV_KEYS = ['S3_REGION', 'NODE_ENV'];

function loadConfig(): any {
  let loaded: any;
  jest.isolateModules(() => {
    loaded = require('./index');
  });
  return loaded;
}

describe('config', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    (dotenv.config as jest.Mock).mockClear();
    for (const key of ENV_KEYS) delete process.env[key];
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('S3_REGION', () => {
    it('defaults to "auto" when unset, so existing deployments keep their region', () => {
      expect(loadConfig().default.s3Region).toBe('auto');
    });

    it('uses S3_REGION when set (e.g. Garage "garage")', () => {
      process.env.S3_REGION = 'garage';
      expect(loadConfig().default.s3Region).toBe('garage');
    });

    it('trims whitespace and falls back to "auto" for an empty value', () => {
      process.env.S3_REGION = '   ';
      expect(loadConfig().default.s3Region).toBe('auto');

      process.env.S3_REGION = ' garage ';
      expect(loadConfig().default.s3Region).toBe('garage');
    });
  });

  describe('env file loading', () => {
    it('loads apps/api/.env first, then the repo-root .env, never overriding', () => {
      const { API_ENV_FILE, ROOT_ENV_FILE } = loadConfig();

      const calls = (dotenv.config as jest.Mock).mock.calls;
      expect(calls).toHaveLength(2);

      expect(calls[0][0]).toEqual({ path: API_ENV_FILE, override: false });
      expect(calls[1][0]).toEqual({ path: ROOT_ENV_FILE, override: false });

      // Paths resolve to apps/api/.env and <root>/.env relative to src/config.
      expect(API_ENV_FILE).toBe(path.resolve(__dirname, '../../.env'));
      expect(ROOT_ENV_FILE).toBe(path.resolve(__dirname, '../../../../.env'));
      expect(API_ENV_FILE.endsWith(path.join('apps', 'api', '.env'))).toBe(true);
    });
  });
});
