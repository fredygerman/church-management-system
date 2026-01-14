/**
 * @church/config - Central configuration and types package
 * 
 * Package structure:
 * - schema/: Re-exported types from @church/db (source of truth)
 * - dtos/: API request/response contracts
 * - types/: Application-level type definitions (notifications, enums, etc.)
 * - utils/: Shared utility functions
 */

// Main exports
export * from './schema';
export * from './dtos';
export * from './types';
export * from './utils';
