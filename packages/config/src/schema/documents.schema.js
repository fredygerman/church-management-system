"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationStatus = exports.DocumentType = exports.documents = exports.verificationStatusEnum = exports.documentTypeEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_schema_1 = require("./users.schema");
exports.documentTypeEnum = (0, pg_core_1.pgEnum)('document_type', [
    'NATIONAL_ID',
    'DRIVERS_LICENSE',
    'VEHICLE_PAPERS',
    'LOCAL_GOV_LETTER',
    'BUSINESS_LICENSE',
    'BUSINESS_REGISTRATION',
]);
exports.verificationStatusEnum = (0, pg_core_1.pgEnum)('verification_status', [
    'PENDING',
    'APPROVED',
    'REJECTED',
]);
exports.documents = (0, pg_core_1.pgTable)('documents', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_schema_1.users.id, { onDelete: 'cascade' }),
    documentType: (0, exports.documentTypeEnum)('document_type').notNull(),
    fileUrl: (0, pg_core_1.varchar)('file_url', { length: 500 }).notNull(),
    fileName: (0, pg_core_1.varchar)('file_name', { length: 255 }).notNull(),
    fileSize: (0, pg_core_1.integer)('file_size').notNull(),
    mimeType: (0, pg_core_1.varchar)('mime_type', { length: 100 }).notNull(),
    verificationStatus: (0, exports.verificationStatusEnum)('verification_status')
        .default('PENDING')
        .notNull(),
    verifiedBy: (0, pg_core_1.uuid)('verified_by').references(() => users_schema_1.users.id, {
        onDelete: 'set null',
    }),
    verifiedAt: (0, pg_core_1.timestamp)('verified_at'),
    rejectionReason: (0, pg_core_1.text)('rejection_reason'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.DocumentType = {
    NATIONAL_ID: 'NATIONAL_ID',
    DRIVERS_LICENSE: 'DRIVERS_LICENSE',
    VEHICLE_PAPERS: 'VEHICLE_PAPERS',
    LOCAL_GOV_LETTER: 'LOCAL_GOV_LETTER',
    BUSINESS_LICENSE: 'BUSINESS_LICENSE',
    BUSINESS_REGISTRATION: 'BUSINESS_REGISTRATION',
};
exports.VerificationStatus = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
};
//# sourceMappingURL=documents.schema.js.map