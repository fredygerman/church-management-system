import { BadRequestException } from '@nestjs/common';

/**
 * Parses and validates optional `limit`/`offset` query strings from a list
 * endpoint. Returns `undefined` for a param that wasn't passed, letting the
 * service apply its own default.
 */
export const parsePagination = (
  limitStr?: string,
  offsetStr?: string,
): { limit?: number; offset?: number } => {
  let limit: number | undefined;
  let offset: number | undefined;

  if (limitStr) {
    limit = parseInt(limitStr, 10);
    if (!Number.isInteger(limit) || limit <= 0) {
      throw new BadRequestException('limit must be a positive integer');
    }
  }

  if (offsetStr) {
    offset = parseInt(offsetStr, 10);
    if (!Number.isInteger(offset) || offset < 0) {
      throw new BadRequestException('offset must be a non-negative integer');
    }
  }

  return { limit, offset };
};
