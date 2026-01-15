/**
 * @church/config - Shared types, schemas, and utilities
 * 
 * Package structure:
 * - schema/: Re-exported database types from @church/db (source of truth)
 * - types/: Application-level types (enums, interfaces, constants)
 * - utils/: Shared utility functions
 * 
 * NOTE: DTOs are API-specific and belong in the backend only.
 * The frontend uses types from this package + Zod schemas for validation.
 */

// Database types (source of truth)
export * from './schema'

// Application-level types (enums, constants, interfaces)
export * from './types/notifications'
export * from './types/visitor'

// Shared utilities
export * from './utils'
