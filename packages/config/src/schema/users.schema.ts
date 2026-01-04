import {
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
  uuid,
  integer,
  date,
  pgEnum,
} from 'drizzle-orm/pg-core';

/**
 * User role enum
 */
export const userRoleEnum = pgEnum('user_role', [
  'CUSTOMER',
  'DRIVER',
  'ADMIN',
  'SUPER_ADMIN',
]);

/**
 * User status enum
 */
export const userStatusEnum = pgEnum('user_status', [
  'PENDING',
  'ACTIVE',
  'SUSPENDED',
  'INACTIVE',
]);

/**
 * Preferred language enum
 */
export const preferredLanguageEnum = pgEnum('preferred_language', ['EN', 'SW']);

/**
 * Users table - stores user account information
 */
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).unique(),
  phone: varchar('phone', { length: 20 }).unique(),
  password: text('password').notNull(),

  // Basic information
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  fullName: varchar('full_name', { length: 255 }),

  // Additional identity information
  dateOfBirth: date('date_of_birth'),
  tinNumber: varchar('tin_number', { length: 50 }).unique(),
  nidaNumber: varchar('nida_number', { length: 50 }).unique(),

  // Profile and preferences
  profilePictureUrl: varchar('profile_picture_url', { length: 500 }),
  preferredLanguage: preferredLanguageEnum('preferred_language')
    .default('EN')
    .notNull(),

  // User role and status
  role: userRoleEnum('role').default('CUSTOMER').notNull(),
  status: userStatusEnum('status').default('PENDING').notNull(),

  // Multi-step registration tracking
  registrationStep: integer('registration_step').default(1).notNull(),
  registrationCompleted: boolean('registration_completed')
    .default(false)
    .notNull(),

  // Account verification
  isActive: boolean('is_active').default(false).notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Export enums
export const UserRole = {
  CUSTOMER: 'CUSTOMER',
  DRIVER: 'DRIVER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export const UserStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  INACTIVE: 'INACTIVE',
} as const;

export const PreferredLanguage = {
  EN: 'EN',
  SW: 'SW',
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];
export type UserStatusType = (typeof UserStatus)[keyof typeof UserStatus];
export type PreferredLanguageType =
  (typeof PreferredLanguage)[keyof typeof PreferredLanguage];
