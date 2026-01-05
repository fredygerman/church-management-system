"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerProfiles = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_schema_1 = require("./users.schema");
exports.customerProfiles = (0, pg_core_1.pgTable)('customer_profiles', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .unique()
        .references(() => users_schema_1.users.id, { onDelete: 'cascade' }),
    businessName: (0, pg_core_1.varchar)('business_name', { length: 255 }).notNull(),
    businessRegistrationNumber: (0, pg_core_1.varchar)('business_registration_number', {
        length: 100,
    })
        .notNull()
        .unique(),
    country: (0, pg_core_1.varchar)('country', { length: 100 }),
    region: (0, pg_core_1.varchar)('region', { length: 100 }),
    district: (0, pg_core_1.varchar)('district', { length: 100 }),
    street: (0, pg_core_1.varchar)('street', { length: 255 }),
    houseNumber: (0, pg_core_1.varchar)('house_number', { length: 50 }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
//# sourceMappingURL=customer-profiles.schema.js.map