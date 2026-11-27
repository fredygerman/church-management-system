import { UnprocessableEntityException } from '@nestjs/common';
import {
  DEFAULT_EXPIRES_IN_DAYS,
  DEFAULT_MAX_USES,
  expiryDate,
  invitationStatus,
  isInvitationUsable,
  resolveExpiresInDays,
  resolveMaxUses,
} from './invitation-policy';

const NOW = new Date('2026-11-27T10:00:00Z');
const LATER = new Date(NOW.getTime() + 60_000);

const base = {
  expiresAt: new Date(NOW.getTime() + 86_400_000),
  revokedAt: null,
  maxUses: 3,
  uses: 0,
};

describe('invitation expiry', () => {
  it('is usable before expiry and not at or after the expiry instant', () => {
    expect(isInvitationUsable(base, NOW)).toBe(true);
    expect(isInvitationUsable({ ...base, expiresAt: NOW }, NOW)).toBe(false);
    expect(isInvitationUsable({ ...base, expiresAt: new Date(NOW.getTime() - 1) }, NOW)).toBe(false);
  });

  it('reports expired status', () => {
    expect(invitationStatus({ ...base, expiresAt: NOW }, NOW)).toBe('expired');
  });

  it('computes expiry from whole days', () => {
    expect(expiryDate(NOW, 14).getTime() - NOW.getTime()).toBe(14 * 86_400_000);
  });
});

describe('invitation max uses', () => {
  it('stops being usable once uses reaches max uses', () => {
    expect(isInvitationUsable({ ...base, uses: 2 }, NOW)).toBe(true);
    expect(isInvitationUsable({ ...base, uses: 3 }, NOW)).toBe(false);
    expect(invitationStatus({ ...base, uses: 3 }, NOW)).toBe('exhausted');
  });
});

describe('invitation revoke', () => {
  it('is never usable once revoked, even with uses and time left', () => {
    expect(isInvitationUsable({ ...base, revokedAt: LATER }, NOW)).toBe(false);
    expect(invitationStatus({ ...base, revokedAt: LATER }, NOW)).toBe('revoked');
  });

  it('reports revoked ahead of expired and exhausted', () => {
    const everything = { ...base, revokedAt: LATER, expiresAt: NOW, uses: 3 };
    expect(invitationStatus(everything, NOW)).toBe('revoked');
  });
});

describe('invitation input limits', () => {
  it('defaults max uses and expiry when omitted', () => {
    expect(resolveMaxUses(undefined)).toBe(DEFAULT_MAX_USES);
    expect(resolveExpiresInDays(undefined)).toBe(DEFAULT_EXPIRES_IN_DAYS);
  });

  it.each([0, 501, 2.5, '5', -1])('rejects max uses %p', (value) => {
    expect(() => resolveMaxUses(value)).toThrow(UnprocessableEntityException);
  });

  it.each([0, 91, 1.5, '7'])('rejects expiry days %p with INVALID_EXPIRY', (value) => {
    expect(() => resolveExpiresInDays(value)).toThrow(UnprocessableEntityException);
  });

  it('accepts the boundaries', () => {
    expect(resolveMaxUses(1)).toBe(1);
    expect(resolveMaxUses(500)).toBe(500);
    expect(resolveExpiresInDays(1)).toBe(1);
    expect(resolveExpiresInDays(90)).toBe(90);
  });
});
