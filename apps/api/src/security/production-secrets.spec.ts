import { assertProductionSecrets, findInsecureProductionSecrets } from './production-secrets';

const STRONG = 'x'.repeat(48);
const DEFAULT_JWT = 'your-super-secret-jwt-key-change-this-in-production';

describe('production secrets fail-fast (RM-005 helper)', () => {
  it('never flags anything outside production', () => {
    expect(findInsecureProductionSecrets({ NODE_ENV: 'development', JWT_SECRET: DEFAULT_JWT })).toEqual([]);
    expect(findInsecureProductionSecrets({ NODE_ENV: 'test' })).toEqual([]);
    expect(() => assertProductionSecrets({ NODE_ENV: 'development' })).not.toThrow();
  });

  it('passes in production when both secrets are set and not defaults', () => {
    const env = { NODE_ENV: 'production', JWT_SECRET: STRONG, SESSION_SECRET: STRONG };
    expect(findInsecureProductionSecrets(env)).toEqual([]);
    expect(() => assertProductionSecrets(env)).not.toThrow();
  });

  it('flags a committed default JWT secret in production', () => {
    const env = { NODE_ENV: 'production', JWT_SECRET: DEFAULT_JWT, SESSION_SECRET: STRONG };
    expect(findInsecureProductionSecrets(env)).toEqual(['JWT_SECRET']);
  });

  it('flags missing or blank secrets in production', () => {
    expect(findInsecureProductionSecrets({ NODE_ENV: 'production', SESSION_SECRET: STRONG })).toEqual(['JWT_SECRET']);
    expect(findInsecureProductionSecrets({ NODE_ENV: 'production', JWT_SECRET: '  ', SESSION_SECRET: STRONG })).toEqual([
      'JWT_SECRET',
    ]);
  });

  it('throws naming the variables but never their values', () => {
    const env = { NODE_ENV: 'production', JWT_SECRET: DEFAULT_JWT, SESSION_SECRET: '' };
    let message = '';
    try {
      assertProductionSecrets(env);
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain('JWT_SECRET');
    expect(message).toContain('SESSION_SECRET');
    expect(message).not.toContain(DEFAULT_JWT);
  });
});
