import { pgTable, text, varchar, timestamp, boolean, integer, uuid } from 'drizzle-orm/pg-core';
import { users } from './user';

export const notifications = pgTable('notifications', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // 'sms', 'email', 'push'
  category: varchar('category', { length: 50 }).notNull(), // 'auth', 'order', etc
  purpose: varchar('purpose', { length: 100 }).notNull(), // 'otp_verification', etc
  recipient: varchar('recipient', { length: 255 }).notNull(), // phone number or email
  sender: varchar('sender', { length: 255 }),
  subject: text('subject'),
  message: text('message').notNull(),
  preview: text('preview'),
  showInApp: boolean('show_in_app').default(true),
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  reference: varchar('reference', { length: 255 }).unique(),
  status: varchar('status', { length: 50 }).default('pending'), // 'pending', 'sent', 'failed', 'delivered'
  response: text('response'), // JSON response from provider
  error: text('error'),
  sentAt: timestamp('sent_at'),
  deliveredAt: timestamp('delivered_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
