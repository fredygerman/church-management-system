import {
  pgTable,
  text,
  timestamp,
  varchar,
  uuid,
  integer,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';

/**
 * Document type enum
 */
export const documentTypeEnum = pgEnum('document_type', [
  'NATIONAL_ID',
  'DRIVERS_LICENSE',
  'VEHICLE_PAPERS',
  'LOCAL_GOV_LETTER',
  'BUSINESS_LICENSE',
  'BUSINESS_REGISTRATION',
]);

/**
 * Verification status enum
 */
export const verificationStatusEnum = pgEnum('verification_status', [
  'PENDING',
  'APPROVED',
  'REJECTED',
]);

/**
 * Documents table - stores user document uploads
 */
export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Document details
  documentType: documentTypeEnum('document_type').notNull(),
  fileUrl: varchar('file_url', { length: 500 }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: integer('file_size').notNull(), // in bytes
  mimeType: varchar('mime_type', { length: 100 }).notNull(),

  // Verification details
  verificationStatus: verificationStatusEnum('verification_status')
    .default('PENDING')
    .notNull(),
  verifiedBy: uuid('verified_by').references(() => users.id, {
    onDelete: 'set null',
  }),
  verifiedAt: timestamp('verified_at'),
  rejectionReason: text('rejection_reason'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Export types
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

// Export enums
export const DocumentType = {
  NATIONAL_ID: 'NATIONAL_ID',
  DRIVERS_LICENSE: 'DRIVERS_LICENSE',
  VEHICLE_PAPERS: 'VEHICLE_PAPERS',
  LOCAL_GOV_LETTER: 'LOCAL_GOV_LETTER',
  BUSINESS_LICENSE: 'BUSINESS_LICENSE',
  BUSINESS_REGISTRATION: 'BUSINESS_REGISTRATION',
} as const;

export const VerificationStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type DocumentTypeType = (typeof DocumentType)[keyof typeof DocumentType];
export type VerificationStatusType = (typeof VerificationStatus)[keyof typeof VerificationStatus];
