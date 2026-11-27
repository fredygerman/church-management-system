import { BadRequestException } from '@nestjs/common';

/** Default lifetime of a presigned GET URL, in seconds. */
export const DEFAULT_SIGNED_GET_TTL_SECONDS = 900;

/**
 * Validates an object key for private storage. Keys must be non-empty relative
 * paths: no leading '/', and no '..' segments that could escape a key prefix.
 * Returns the key unchanged when valid.
 */
export function assertValidPrivateKey(key: unknown): string {
  if (typeof key !== 'string' || key.length === 0) {
    throw new BadRequestException('Storage key must be a non-empty string');
  }
  if (key.startsWith('/')) {
    throw new BadRequestException('Storage key must not start with "/"');
  }
  if (key.split('/').some((segment) => segment === '..')) {
    throw new BadRequestException('Storage key must not contain ".." segments');
  }
  return key;
}
