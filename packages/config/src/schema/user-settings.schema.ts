import {
  pgTable,
  boolean,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';

/**
 * User Settings table - stores user preferences and notification settings
 */
export const userSettings = pgTable('user_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Appearance settings
  darkMode: boolean('dark_mode').default(false).notNull(),

  // Notification preferences
  pushNotifications: boolean('push_notifications').default(true).notNull(),
  emailAlerts: boolean('email_alerts').default(true).notNull(),
  smsNotifications: boolean('sms_notifications').default(true).notNull(),
  transactionNotifications: boolean('transaction_notifications')
    .default(true)
    .notNull(),
  billPaymentReminders: boolean('bill_payment_reminders')
    .default(true)
    .notNull(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Export types
export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
