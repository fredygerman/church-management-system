"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonNotificationPurposes = exports.NotificationStatus = exports.NotificationType = exports.NotificationCategory = exports.notifications = exports.notificationStatusEnum = exports.notificationCategoryEnum = exports.notificationTypeEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_schema_1 = require("./users.schema");
exports.notificationTypeEnum = (0, pg_core_1.pgEnum)('notification_type', [
    'sms',
    'email',
    'push',
]);
exports.notificationCategoryEnum = (0, pg_core_1.pgEnum)('notification_category', [
    'auth',
    'account',
    'order',
    'shipment',
    'payment',
    'system',
    'marketing',
]);
exports.notificationStatusEnum = (0, pg_core_1.pgEnum)('notification_status', [
    'pending',
    'sent',
    'failed',
    'delivered',
]);
exports.notifications = (0, pg_core_1.pgTable)('notifications', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('user_id')
        .notNull()
        .references(() => users_schema_1.users.id, { onDelete: 'cascade' }),
    type: (0, exports.notificationTypeEnum)('type').notNull(),
    recipient: (0, pg_core_1.varchar)('recipient', { length: 255 }).notNull(),
    sender: (0, pg_core_1.varchar)('sender', { length: 100 }),
    category: (0, exports.notificationCategoryEnum)('category').notNull(),
    purpose: (0, pg_core_1.varchar)('purpose', { length: 100 }).notNull(),
    subject: (0, pg_core_1.varchar)('subject', { length: 255 }),
    message: (0, pg_core_1.text)('message').notNull(),
    preview: (0, pg_core_1.varchar)('preview', { length: 200 }),
    showInApp: (0, pg_core_1.boolean)('show_in_app').default(false).notNull(),
    isRead: (0, pg_core_1.boolean)('is_read').default(false).notNull(),
    readAt: (0, pg_core_1.timestamp)('read_at'),
    reference: (0, pg_core_1.varchar)('reference', { length: 100 }).notNull().unique(),
    status: (0, exports.notificationStatusEnum)('status').notNull().default('pending'),
    response: (0, pg_core_1.json)('response'),
    error: (0, pg_core_1.text)('error'),
    metadata: (0, pg_core_1.json)('metadata').$type(),
    sentAt: (0, pg_core_1.timestamp)('sent_at'),
    deliveredAt: (0, pg_core_1.timestamp)('delivered_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.NotificationCategory = {
    AUTH: 'auth',
    ACCOUNT: 'account',
    ORDER: 'order',
    SHIPMENT: 'shipment',
    PAYMENT: 'payment',
    SYSTEM: 'system',
    MARKETING: 'marketing',
};
exports.NotificationType = {
    SMS: 'sms',
    EMAIL: 'email',
    PUSH: 'push',
};
exports.NotificationStatus = {
    PENDING: 'pending',
    SENT: 'sent',
    FAILED: 'failed',
    DELIVERED: 'delivered',
};
exports.CommonNotificationPurposes = {
    OTP_VERIFICATION: 'otp_verification',
    PASSWORD_RESET: 'password_reset',
    ACCOUNT_CREATED: 'account_created',
    ACCOUNT_UPDATED: 'account_updated',
    PROFILE_COMPLETED: 'profile_completed',
    ORDER_CONFIRMED: 'order_confirmed',
    ORDER_SHIPPED: 'order_shipped',
    ORDER_DELIVERED: 'order_delivered',
    ORDER_CANCELLED: 'order_cancelled',
    PAYMENT_SUCCESS: 'payment_success',
    PAYMENT_FAILED: 'payment_failed',
    PAYMENT_REMINDER: 'payment_reminder',
    SHIPMENT_CREATED: 'shipment_created',
    SHIPMENT_IN_TRANSIT: 'shipment_in_transit',
    SHIPMENT_DELIVERED: 'shipment_delivered',
    SYSTEM_MAINTENANCE: 'system_maintenance',
    FEATURE_ANNOUNCEMENT: 'feature_announcement',
    PROMO_CAMPAIGN: 'promo_campaign',
    SEASONAL_OFFER: 'seasonal_offer',
};
//# sourceMappingURL=notifications.schema.js.map