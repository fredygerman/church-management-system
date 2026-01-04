import {
  pgTable,
  text,
  timestamp,
  varchar,
  uuid,
  boolean,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';

/**
 * OTP table - stores one-time passwords for user verification
 */
export const otps = pgTable('otps', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 6 }).notNull(),
  purpose: varchar('purpose', { length: 50 }).notNull(), // 'registration', 'password-reset', 'login'
  isUsed: boolean('is_used').default(false).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Export types
export type Otp = typeof otps.$inferSelect;
export type NewOtp = typeof otps.$inferInsert;

// OTP purposes enum for type safety
export const OtpPurpose = {
  REGISTRATION: 'registration',
  PASSWORD_RESET: 'password-reset',
  LOGIN: 'login',
} as const;

export type OtpPurposeType = (typeof OtpPurpose)[keyof typeof OtpPurpose];
