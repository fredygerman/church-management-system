"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentWebhooks = exports.payments = exports.paymentChannelEnum = exports.paymentStatusEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_schema_1 = require("./users.schema");
exports.paymentStatusEnum = (0, pg_core_1.pgEnum)('payment_status', [
    'PENDING',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
]);
exports.paymentChannelEnum = (0, pg_core_1.pgEnum)('payment_channel', [
    'MPESA-TZ',
    'TIGO-TZ',
    'AIRTEL-TZ',
]);
exports.payments = (0, pg_core_1.pgTable)('payments', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => users_schema_1.users.id, { onDelete: 'cascade' }),
    orderId: (0, pg_core_1.varchar)('order_id', { length: 255 }).notNull().unique(),
    buyerEmail: (0, pg_core_1.varchar)('buyer_email', { length: 255 }).notNull(),
    buyerName: (0, pg_core_1.varchar)('buyer_name', { length: 255 }).notNull(),
    buyerPhone: (0, pg_core_1.varchar)('buyer_phone', { length: 20 }).notNull(),
    amount: (0, pg_core_1.integer)('amount').notNull(),
    paymentStatus: (0, exports.paymentStatusEnum)('payment_status')
        .default('PENDING')
        .notNull(),
    channel: (0, exports.paymentChannelEnum)('payment_channel'),
    transactionId: (0, pg_core_1.varchar)('transaction_id', { length: 255 }),
    reference: (0, pg_core_1.varchar)('reference', { length: 255 }),
    msisdn: (0, pg_core_1.varchar)('msisdn', { length: 20 }),
    webhookUrl: (0, pg_core_1.text)('webhook_url'),
    metadata: (0, pg_core_1.text)('metadata'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.paymentWebhooks = (0, pg_core_1.pgTable)('payment_webhooks', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    orderId: (0, pg_core_1.varchar)('order_id', { length: 255 }).notNull(),
    paymentStatus: (0, pg_core_1.varchar)('payment_status', { length: 50 }).notNull(),
    reference: (0, pg_core_1.varchar)('reference', { length: 255 }).notNull(),
    metadata: (0, pg_core_1.text)('metadata'),
    processed: (0, pg_core_1.timestamp)('processed').defaultNow().notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
//# sourceMappingURL=payments.schema.js.map