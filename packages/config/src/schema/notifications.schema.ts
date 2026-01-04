import {
  pgTable,
  text,
  timestamp,
  varchar,
  json,
  boolean,
  pgEnum,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';

// Keep type as enum (this rarely changes)
export const notificationTypeEnum = pgEnum('notification_type', [
  'sms',
  'email',
  'push',
]);

// Category enum - high-level grouping that won't change often
export const notificationCategoryEnum = pgEnum('notification_category', [
  'auth', // Authentication related
  'account', // Account/profile updates
  'order', // Order related
  'shipment', // Shipment tracking
  'payment', // Payment related
  'system', // System announcements
  'marketing', // Marketing/promotional
]);

// Status enum (this is stable)
export const notificationStatusEnum = pgEnum('notification_status', [
  'pending',
  'sent',
  'failed',
  'delivered',
]);

/**
 * Notifications table - stores all notification records (SMS, Email, Push)
 * This table tracks all outbound communications from the system
 */
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),

  // User association
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Notification type and delivery information
  type: notificationTypeEnum('type').notNull(),
  recipient: varchar('recipient', { length: 255 }).notNull(), // phone number or email
  sender: varchar('sender', { length: 100 }), // SMS sender ID or email from address

  // Flexible purpose system
  category: notificationCategoryEnum('category').notNull(), // High-level grouping
  purpose: varchar('purpose', { length: 100 }).notNull(), // Flexible: 'order_confirmation', 'custom_promo', etc.

  // Message content
  subject: varchar('subject', { length: 255 }), // For email or notification title
  message: text('message').notNull(), // The actual message content
  preview: varchar('preview', { length: 200 }), // Short preview for notification list

  // Visibility and interaction controls
  showInApp: boolean('show_in_app').default(false).notNull(), // Should this appear in notification center?
  isRead: boolean('is_read').default(false).notNull(),
  readAt: timestamp('read_at'),

  // Tracking and status
  reference: varchar('reference', { length: 100 }).notNull().unique(), // Unique reference for tracking
  status: notificationStatusEnum('status').notNull().default('pending'),

  // Response and error tracking
  response: json('response'), // API response from SMS/Email provider
  error: text('error'), // Error message if failed

  // Metadata for linking to other entities
  metadata: json('metadata').$type<{
    orderId?: number;
    shipmentId?: number;
    paymentId?: number;
    deepLink?: string; // e.g., '/orders/123', '/shipments/456'
    actionUrl?: string; // External URL if needed
    [key: string]: any;
  }>(),

  // Timestamps
  sentAt: timestamp('sent_at'), // When the notification was sent
  deliveredAt: timestamp('delivered_at'), // When the notification was delivered (if supported)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Export types
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

// Export constants for categories (these are stable)
export const NotificationCategory = {
  AUTH: 'auth' as const,
  ACCOUNT: 'account' as const,
  ORDER: 'order' as const,
  SHIPMENT: 'shipment' as const,
  PAYMENT: 'payment' as const,
  SYSTEM: 'system' as const,
  MARKETING: 'marketing' as const,
} as const;

export const NotificationType = {
  SMS: 'sms' as const,
  EMAIL: 'email' as const,
  PUSH: 'push' as const,
} as const;

export const NotificationStatus = {
  PENDING: 'pending' as const,
  SENT: 'sent' as const,
  FAILED: 'failed' as const,
  DELIVERED: 'delivered' as const,
} as const;

// Common purpose constants (but these can be any string)
export const CommonNotificationPurposes = {
  // Auth
  OTP_VERIFICATION: 'otp_verification',
  PASSWORD_RESET: 'password_reset',

  // Account
  ACCOUNT_CREATED: 'account_created',
  ACCOUNT_UPDATED: 'account_updated',
  PROFILE_COMPLETED: 'profile_completed',

  // Orders
  ORDER_CONFIRMED: 'order_confirmed',
  ORDER_SHIPPED: 'order_shipped',
  ORDER_DELIVERED: 'order_delivered',
  ORDER_CANCELLED: 'order_cancelled',

  // Payments
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  PAYMENT_REMINDER: 'payment_reminder',

  // Shipments
  SHIPMENT_CREATED: 'shipment_created',
  SHIPMENT_IN_TRANSIT: 'shipment_in_transit',
  SHIPMENT_DELIVERED: 'shipment_delivered',

  // System
  SYSTEM_MAINTENANCE: 'system_maintenance',
  FEATURE_ANNOUNCEMENT: 'feature_announcement',

  // Marketing
  PROMO_CAMPAIGN: 'promo_campaign',
  SEASONAL_OFFER: 'seasonal_offer',
} as const;

export type NotificationCategoryType =
  (typeof NotificationCategory)[keyof typeof NotificationCategory];
export type NotificationTypeType =
  (typeof NotificationType)[keyof typeof NotificationType];
export type NotificationStatusType =
  (typeof NotificationStatus)[keyof typeof NotificationStatus];
