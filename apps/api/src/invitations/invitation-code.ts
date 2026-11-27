import { createHmac, randomInt } from 'crypto';

/** 31 symbols: no 0, O, 1, I or L, so codes read clearly when typed or spoken. */
export const INVITATION_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const INVITATION_CODE_LENGTH = 8;
const NORMALISED_CODE = new RegExp(`^[${INVITATION_CODE_ALPHABET}]{${INVITATION_CODE_LENGTH}}$`);
const HMAC_KEY_ENV = 'INVITATION_CODE_HMAC_KEY';
const MIN_HMAC_KEY_LENGTH = 32;

/** Generates a code shown once to an admin, grouped as XXXX-XXXX for reading aloud. */
export function generateInvitationCode(): string {
  let raw = '';
  for (let i = 0; i < INVITATION_CODE_LENGTH; i += 1) {
    raw += INVITATION_CODE_ALPHABET[randomInt(INVITATION_CODE_ALPHABET.length)];
  }
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

/**
 * Strips separators and case from user input. Returns null when the input cannot
 * be a valid code, so callers can answer with the same INVALID_CODE response.
 */
export function normalizeInvitationCode(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const normalised = input.replace(/[\s-]/g, '').toUpperCase();
  return NORMALISED_CODE.test(normalised) ? normalised : null;
}

/** Last four symbols of the normalised code, stored for admin display only. */
export function lastCharsOf(normalisedCode: string): string {
  return normalisedCode.slice(-4);
}

/** Reads the HMAC key from the environment. Fails closed when it is missing or weak. */
export function requireInvitationHmacKey(env: NodeJS.ProcessEnv = process.env): string {
  const key = env[HMAC_KEY_ENV];
  if (!key || key.length < MIN_HMAC_KEY_LENGTH) {
    throw new Error(`${HMAC_KEY_ENV} must be set to at least ${MIN_HMAC_KEY_LENGTH} characters`);
  }
  return key;
}

/** HMAC-SHA256 hex digest of a normalised code. The plaintext code is never stored. */
export function hashInvitationCode(normalisedCode: string, key: string = requireInvitationHmacKey()): string {
  return createHmac('sha256', key).update(normalisedCode).digest('hex');
}
