"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSettings = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_schema_1 = require("./users.schema");
exports.userSettings = (0, pg_core_1.pgTable)('user_settings', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .unique()
        .references(() => users_schema_1.users.id, { onDelete: 'cascade' }),
    darkMode: (0, pg_core_1.boolean)('dark_mode').default(false).notNull(),
    pushNotifications: (0, pg_core_1.boolean)('push_notifications').default(true).notNull(),
    emailAlerts: (0, pg_core_1.boolean)('email_alerts').default(true).notNull(),
    smsNotifications: (0, pg_core_1.boolean)('sms_notifications').default(true).notNull(),
    transactionNotifications: (0, pg_core_1.boolean)('transaction_notifications')
        .default(true)
        .notNull(),
    billPaymentReminders: (0, pg_core_1.boolean)('bill_payment_reminders')
        .default(true)
        .notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
//# sourceMappingURL=user-settings.schema.js.map