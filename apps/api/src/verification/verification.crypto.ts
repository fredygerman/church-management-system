import { createHmac, randomInt, timingSafeEqual } from 'crypto';

// Same fallback as config/index.ts (session.secret). Must never be used in production.
export const PLACEHOLDER_SECRET =
  'your-super-secret-session-key-change-this-in-production';
const MIN_PRODUCTION_SECRET_LENGTH = 32;

/** Six-digit code from a CSPRNG, zero-padded. */
export function generateCode(
  random: (exclusiveMax: number) => number = (max) => randomInt(max),
): string {
  return String(random(1_000_000)).padStart(6, '0');
}

/**
 * HMAC-SHA256 of a code. The channel and destination are part of the signed
 * message, so a stored hash cannot be replayed against another address.
 */
export function hashCode(
  secret: string,
  channel: string,
  destination: string,
  code: string,
): string {
  return createHmac('sha256', secret)
    .update(`contact-verification:v1|${channel}|${destination}|${code}`)
    .digest('hex');
}

/** Constant-time comparison of two hex digests. */
export function hashesMatch(expected: string, actual: string): boolean {
  const left = Buffer.from(expected, 'utf8');
  const right = Buffer.from(actual, 'utf8');
  return left.length === right.length && timingSafeEqual(left, right);
}

/** In production the secret must be real and long; elsewhere it only has to exist. */
export function isUsableHmacSecret(secret: string, isProduction: boolean): boolean {
  if (!secret) return false;
  if (!isProduction) return true;
  return secret.length >= MIN_PRODUCTION_SECRET_LENGTH && secret !== PLACEHOLDER_SECRET;
}
