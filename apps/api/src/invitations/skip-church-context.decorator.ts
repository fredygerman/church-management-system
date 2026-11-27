import { SetMetadata } from '@nestjs/common';

/**
 * Marks a route that must run without an active church context (the join flow).
 * ChurchContextGuard has to read this key and return true early. That guard lives in
 * auth/** and is not changed by this module.
 */
export const SKIP_CHURCH_CONTEXT_KEY = 'skipChurchContext';
export const SkipChurchContext = () => SetMetadata(SKIP_CHURCH_CONTEXT_KEY, true);
