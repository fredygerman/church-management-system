import {
  generateInvitationCode,
  hashInvitationCode,
  INVITATION_CODE_ALPHABET,
  lastCharsOf,
  normalizeInvitationCode,
  requireInvitationHmacKey,
} from './invitation-code';

const KEY = 'test-invitation-hmac-key-0123456789abcdef';

describe('invitation codes', () => {
  it('generates grouped codes from the unambiguous alphabet only', () => {
    for (let i = 0; i < 200; i += 1) {
      const code = generateInvitationCode();
      expect(code).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/);
      expect(code).not.toMatch(/[0OI1L]/);
    }
  });

  it('excludes 0, O, 1, I and L from the alphabet', () => {
    expect(INVITATION_CODE_ALPHABET).toHaveLength(31);
    for (const ambiguous of ['0', 'O', '1', 'I', 'L']) {
      expect(INVITATION_CODE_ALPHABET).not.toContain(ambiguous);
    }
  });

  it('normalises case, spaces and dashes', () => {
    expect(normalizeInvitationCode('k7mq-4xwd')).toBe('K7MQ4XWD');
    expect(normalizeInvitationCode(' K7MQ 4XWD ')).toBe('K7MQ4XWD');
  });

  it('rejects input that cannot be a code', () => {
    expect(normalizeInvitationCode('K7MQ-4XW')).toBeNull();
    expect(normalizeInvitationCode('K7MQ-4XW0')).toBeNull();
    expect(normalizeInvitationCode(12345678)).toBeNull();
    expect(normalizeInvitationCode(undefined)).toBeNull();
  });

  it('hashes with HMAC-SHA256, deterministically and without the plaintext', () => {
    const first = hashInvitationCode('K7MQ4XWD', KEY);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(hashInvitationCode('K7MQ4XWD', KEY)).toBe(first);
    expect(first).not.toContain('K7MQ');
  });

  it('changes the hash when the key changes, so a leaked table is useless without the key', () => {
    expect(hashInvitationCode('K7MQ4XWD', KEY)).not.toBe(
      hashInvitationCode('K7MQ4XWD', 'another-invitation-hmac-key-0123456789'),
    );
  });

  it('keeps only the last four characters for admin display', () => {
    expect(lastCharsOf('K7MQ4XWD')).toBe('4XWD');
  });

  it('fails closed when the HMAC key is missing or too short', () => {
    expect(() => requireInvitationHmacKey({})).toThrow(/INVITATION_CODE_HMAC_KEY/);
    expect(() => requireInvitationHmacKey({ INVITATION_CODE_HMAC_KEY: 'short' })).toThrow(/INVITATION_CODE_HMAC_KEY/);
    expect(requireInvitationHmacKey({ INVITATION_CODE_HMAC_KEY: KEY })).toBe(KEY);
  });
});
