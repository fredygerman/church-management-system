import {
  pgTable,
  text,
  timestamp,
  varchar,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';

/**
 * Customer Profiles table - stores business profile information for customers
 */
export const customerProfiles = pgTable('customer_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Business information
  businessName: varchar('business_name', { length: 255 }).notNull(),
  businessRegistrationNumber: varchar('business_registration_number', {
    length: 100,
  })
    .notNull()
    .unique(),

  // Address information
  country: varchar('country', { length: 100 }),
  region: varchar('region', { length: 100 }),
  district: varchar('district', { length: 100 }),
  street: varchar('street', { length: 255 }),
  houseNumber: varchar('house_number', { length: 50 }),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Export types
export type CustomerProfile = typeof customerProfiles.$inferSelect;
export type NewCustomerProfile = typeof customerProfiles.$inferInsert;
