import {
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  pgEnum,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';

/**
 * Payment status enum - matches ZenoPay status values
 */
export const paymentStatusEnum = pgEnum('payment_status', [
  'PENDING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
]);

/**
 * Payment channel enum - supported mobile money providers in Tanzania
 */
export const paymentChannelEnum = pgEnum('payment_channel', [
  'MPESA-TZ',
  'TIGO-TZ',
  'AIRTEL-TZ',
]);

/**
 * Payments table - stores all payment transactions
 */
export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }), // Foreign key to users table (nullable for test payments)
  orderId: varchar('order_id', { length: 255 }).notNull().unique(),
  buyerEmail: varchar('buyer_email', { length: 255 }).notNull(),
  buyerName: varchar('buyer_name', { length: 255 }).notNull(),
  buyerPhone: varchar('buyer_phone', { length: 20 }).notNull(),
  amount: integer('amount').notNull(), // Amount in TZS (no decimals)
  paymentStatus: paymentStatusEnum('payment_status')
    .default('PENDING')
    .notNull(),
  channel: paymentChannelEnum('payment_channel'),
  transactionId: varchar('transaction_id', { length: 255 }), // ZenoPay transaction ID
  reference: varchar('reference', { length: 255 }), // Mobile money reference
  msisdn: varchar('msisdn', { length: 20 }), // International format phone number
  webhookUrl: text('webhook_url'),
  metadata: text('metadata'), // JSON string for additional data
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Export types
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

/**
 * Payment webhooks table - logs all webhook events received
 */
export const paymentWebhooks = pgTable('payment_webhooks', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: varchar('order_id', { length: 255 }).notNull(),
  paymentStatus: varchar('payment_status', { length: 50 }).notNull(),
  reference: varchar('reference', { length: 255 }).notNull(),
  metadata: text('metadata'), // JSON string
  processed: timestamp('processed').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Export webhook types
export type PaymentWebhook = typeof paymentWebhooks.$inferSelect;
export type NewPaymentWebhook = typeof paymentWebhooks.$inferInsert;
