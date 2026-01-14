/**
 * @deprecated Use imports from '@church/db' directly instead
 * This file is kept for backward compatibility during migration
 * 
 * Migration path:
 * - Old: import { User, users } from '../database/schema'
 * - New: import { User, users } from '@church/db'
 */

// Re-export everything from @church/db for backward compatibility
export * from '@church/db';

// Explicit re-exports to ensure TypeScript picks them up
export {
  notifications,
  type NewNotification,
  type Notification,
} from '@church/db';
