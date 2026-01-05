"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpPurpose = exports.otps = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_schema_1 = require("./users.schema");
exports.otps = (0, pg_core_1.pgTable)('otps', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_schema_1.users.id, { onDelete: 'cascade' }),
    code: (0, pg_core_1.varchar)('code', { length: 6 }).notNull(),
    purpose: (0, pg_core_1.varchar)('purpose', { length: 50 }).notNull(),
    isUsed: (0, pg_core_1.boolean)('is_used').default(false).notNull(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.OtpPurpose = {
    REGISTRATION: 'registration',
    PASSWORD_RESET: 'password-reset',
    LOGIN: 'login',
};
//# sourceMappingURL=otp.schema.js.map