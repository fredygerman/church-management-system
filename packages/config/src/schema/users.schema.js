"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreferredLanguage = exports.UserStatus = exports.UserRole = exports.users = exports.preferredLanguageEnum = exports.userStatusEnum = exports.userRoleEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.userRoleEnum = (0, pg_core_1.pgEnum)('user_role', [
    'CUSTOMER',
    'DRIVER',
    'ADMIN',
    'SUPER_ADMIN',
]);
exports.userStatusEnum = (0, pg_core_1.pgEnum)('user_status', [
    'PENDING',
    'ACTIVE',
    'SUSPENDED',
    'INACTIVE',
]);
exports.preferredLanguageEnum = (0, pg_core_1.pgEnum)('preferred_language', ['EN', 'SW']);
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).unique(),
    phone: (0, pg_core_1.varchar)('phone', { length: 20 }).unique(),
    password: (0, pg_core_1.text)('password').notNull(),
    firstName: (0, pg_core_1.varchar)('first_name', { length: 100 }),
    lastName: (0, pg_core_1.varchar)('last_name', { length: 100 }),
    fullName: (0, pg_core_1.varchar)('full_name', { length: 255 }),
    dateOfBirth: (0, pg_core_1.date)('date_of_birth'),
    tinNumber: (0, pg_core_1.varchar)('tin_number', { length: 50 }).unique(),
    nidaNumber: (0, pg_core_1.varchar)('nida_number', { length: 50 }).unique(),
    profilePictureUrl: (0, pg_core_1.varchar)('profile_picture_url', { length: 500 }),
    preferredLanguage: (0, exports.preferredLanguageEnum)('preferred_language')
        .default('EN')
        .notNull(),
    role: (0, exports.userRoleEnum)('role').default('CUSTOMER').notNull(),
    status: (0, exports.userStatusEnum)('status').default('PENDING').notNull(),
    registrationStep: (0, pg_core_1.integer)('registration_step').default(1).notNull(),
    registrationCompleted: (0, pg_core_1.boolean)('registration_completed')
        .default(false)
        .notNull(),
    isActive: (0, pg_core_1.boolean)('is_active').default(false).notNull(),
    isVerified: (0, pg_core_1.boolean)('is_verified').default(false).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.UserRole = {
    CUSTOMER: 'CUSTOMER',
    DRIVER: 'DRIVER',
    ADMIN: 'ADMIN',
    SUPER_ADMIN: 'SUPER_ADMIN',
};
exports.UserStatus = {
    PENDING: 'PENDING',
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED',
    INACTIVE: 'INACTIVE',
};
exports.PreferredLanguage = {
    EN: 'EN',
    SW: 'SW',
};
//# sourceMappingURL=users.schema.js.map