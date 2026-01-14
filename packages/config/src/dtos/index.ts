/**
 * Data Transfer Objects (DTOs)
 * 
 * These are application-level contracts for API requests and responses.
 * They may differ from database types for validation, transformation, or security purposes.
 * 
 * For database type definitions, see @church/config/schema (re-exported from @church/db)
 */

// Mail DTOs
export * from './mail';

// SMS DTOs
export * from './sms';
