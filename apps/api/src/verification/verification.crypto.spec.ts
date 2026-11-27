import { createHmac } from 'crypto';
import {
  generateCode,
  hashCode,
  hashesMatch,
  isUsableHmacSecret,
  PLACEHOLDER_SECRET,
} from './verification.crypto';

const SECRET = 'a-test-secret-with-plenty-of-characters-0123';

describe('verification crypto', () => {
  describe('generateCode', () => {
    it('returns six zero-padded digits', () => {
      expect(generateCode(() => 42)).toBe('000042');
      expect(generateCode(() => 0)).toBe('000000');
      expect(generateCode(() => 999_999)).toBe('999999');
    });

    it('draws from the full 10^6 range', () => {
      let requestedMax = 0;
      generateCode((max) => {
        requestedMax = max;
        return 1;
      });
      expect(requestedMax).toBe(1_000_000);
    });

    it('produces only digits with the default CSPRNG source', () => {
      for (let i = 0; i < 50; i += 1) {
        expect(generateCode()).toMatch(/^\d{6}$/);
      }
    });
  });

  describe('hashCode', () => {
    it('is HMAC-SHA256 over the documented message, hex encoded', () => {
      const expected = createHmac('sha256', SECRET)
        .update('contact-verification:v1|email|member@example.org|123456')
        .digest('hex');
      expect(hashCode(SECRET, 'email', 'member@example.org', '123456')).toBe(expected);
    });

    it('is 64 hex characters and does not contain the code', () => {
      const digest = hashCode(SECRET, 'phone', '+255712345678', '123456');
      expect(digest).toMatch(/^[0-9a-f]{64}$/);
      expect(digest).not.toContain('123456');
    });

    it('is deterministic for identical inputs', () => {
      expect(hashCode(SECRET, 'email', 'a@b.org', '654321')).toBe(
        hashCode(SECRET, 'email', 'a@b.org', '654321'),
      );
    });

    it('changes when the secret, channel, destination or code changes', () => {
      const base = hashCode(SECRET, 'email', 'a@b.org', '654321');
      expect(hashCode('another-secret-value-of-some-length-99', 'email', 'a@b.org', '654321')).not.toBe(base);
      expect(hashCode(SECRET, 'phone', 'a@b.org', '654321')).not.toBe(base);
      expect(hashCode(SECRET, 'email', 'c@b.org', '654321')).not.toBe(base);
      expect(hashCode(SECRET, 'email', 'a@b.org', '654322')).not.toBe(base);
    });
  });

  describe('hashesMatch', () => {
    it('accepts equal digests', () => {
      const digest = hashCode(SECRET, 'email', 'a@b.org', '000001');
      expect(hashesMatch(digest, digest)).toBe(true);
    });

    it('rejects different digests of the same length', () => {
      const a = hashCode(SECRET, 'email', 'a@b.org', '000001');
      const b = hashCode(SECRET, 'email', 'a@b.org', '000002');
      expect(hashesMatch(a, b)).toBe(false);
    });

    it('rejects digests of different length without throwing', () => {
      expect(hashesMatch('abcd', 'abcdef')).toBe(false);
    });
  });

  describe('isUsableHmacSecret', () => {
    it('accepts any non-empty secret outside production', () => {
      expect(isUsableHmacSecret('x', false)).toBe(true);
      expect(isUsableHmacSecret(PLACEHOLDER_SECRET, false)).toBe(true);
    });

    it('rejects an empty secret everywhere', () => {
      expect(isUsableHmacSecret('', false)).toBe(false);
      expect(isUsableHmacSecret('', true)).toBe(false);
    });

    it('refuses the placeholder and short secrets in production', () => {
      expect(isUsableHmacSecret(PLACEHOLDER_SECRET, true)).toBe(false);
      expect(isUsableHmacSecret('too-short', true)).toBe(false);
    });

    it('accepts a long real secret in production', () => {
      expect(isUsableHmacSecret(SECRET, true)).toBe(true);
    });
  });
});
