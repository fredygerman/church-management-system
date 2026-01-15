/**
 * @church/config - Shared types, schemas, and utilities
 * 
 * Package structure:
 * - schema/: Re-exported database types from @church/db (source of truth)
 * - types/: Application-level types (enums, interfaces, constants)
 * - utils/: Shared utility functions
 * - permissions: Permission system (safe for client components)
 * 
 * NOTE: DTOs are API-specific and belong in the backend only.
 * The frontend uses types from this package + Zod schemas for validation.
 */

// Application-level types (enums, constants, interfaces) - Client-safe
export * from './types/notifications'
export * from './types/visitor'
export * from './permissions'

// Shared utilities - Client-safe
export * from './utils'

// Database types (source of truth) - Server-only
// IMPORTANT: Only import in server components/actions
export * from './schema'
