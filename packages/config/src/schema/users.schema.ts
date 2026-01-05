import {
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
  uuid,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';

/**
 * User role enum - Church Management System roles
 */
export const userRoleEnum = pgEnum('user_role', [
  'MEMBER',              // Regular church member
  'BRANCH_ADMIN',        // Local branch administrator
  'SUPER_ADMIN',         // HQ administrator with full access
]);

/**
 * User status enum
 */
export const userStatusEnum = pgEnum('user_status', [
  'PENDING',             // User created but not yet active
  'ACTIVE',              // Active user
  'SUSPENDED',           // Temporarily disabled
  'INACTIVE',            // Inactive/archived
]);

/**
 * Preferred language enum
 */
export const preferredLanguageEnum = pgEnum('preferred_language', ['EN', 'SW']);

/**
 * Users table - stores user account information
 * Soft delete: filter by deletedAt IS NULL
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    phone: varchar('phone', { length: 20 }).unique(),
    password: text('password').notNull(),

    // Basic information
    firstName: varchar('first_name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }),
    profilePictureUrl: varchar('profile_picture_url', { length: 500 }),

    // Preferences
    preferredLanguage: preferredLanguageEnum('preferred_language')
      .default('EN')
      .notNull(),

    // Status
    status: userStatusEnum('status').default('PENDING').notNull(),
    isVerified: boolean('is_verified').default(false).notNull(),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    emailIdx: index('idx_users_email').on(table.email),
    phoneIdx: index('idx_users_phone').on(table.phone),
    statusIdx: index('idx_users_status').on(table.status),
  })
);

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Export enums
export const UserRole = {
  MEMBER: 'MEMBER',
  BRANCH_ADMIN: 'BRANCH_ADMIN',
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
