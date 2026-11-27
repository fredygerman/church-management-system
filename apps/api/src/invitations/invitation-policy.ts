import { UnprocessableEntityException } from '@nestjs/common';

export const DEFAULT_MAX_USES = 50;
export const MAX_MAX_USES = 500;
export const DEFAULT_EXPIRES_IN_DAYS = 14;
export const MAX_EXPIRES_IN_DAYS = 90;

/** The subset of an invitation row that decides whether a code can still be used. */
export interface InvitationUsageState {
  expiresAt: Date;
  revokedAt: Date | null;
  maxUses: number;
  uses: number;
}

/** A code works only if it is not revoked, not expired and has uses left. */
export function isInvitationUsable(invitation: InvitationUsageState, now: Date): boolean {
  return (
    invitation.revokedAt === null &&
    invitation.expiresAt.getTime() > now.getTime() &&
    invitation.uses < invitation.maxUses
  );
}

export type InvitationStatus = 'active' | 'expired' | 'exhausted' | 'revoked';

/** Admin-facing status. Revoked wins over expired, which wins over exhausted. */
export function invitationStatus(invitation: InvitationUsageState, now: Date): InvitationStatus {
  if (invitation.revokedAt !== null) return 'revoked';
  if (invitation.expiresAt.getTime() <= now.getTime()) return 'expired';
  if (invitation.uses >= invitation.maxUses) return 'exhausted';
  return 'active';
}

function requireInteger(value: unknown, min: number, max: number, code: string, label: string, fallback: number): number {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    throw new UnprocessableEntityException({
      code,
      message: `${label} must be a whole number from ${min} to ${max}.`,
    });
  }
  return value;
}

export function resolveMaxUses(value: unknown): number {
  return requireInteger(value, 1, MAX_MAX_USES, 'INVALID_MAX_USES', 'maxUses', DEFAULT_MAX_USES);
}

export function resolveExpiresInDays(value: unknown): number {
  return requireInteger(value, 1, MAX_EXPIRES_IN_DAYS, 'INVALID_EXPIRY', 'expiresInDays', DEFAULT_EXPIRES_IN_DAYS);
}

export function expiryDate(now: Date, days: number): Date {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}
