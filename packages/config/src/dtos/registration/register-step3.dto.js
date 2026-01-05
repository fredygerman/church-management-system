"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterStep3Dto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class RegisterStep3Dto {
}
exports.RegisterStep3Dto = RegisterStep3Dto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User ID from previous registration step',
        example: '550e8400-e29b-41d4-a716-446655440000',
        format: 'uuid',
    }),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid user ID format' }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegisterStep3Dto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User email address (required if not provided in Step 1)',
        example: 'john.doe@church.org',
    }),
    (0, class_validator_1.ValidateIf)(o => !o.phone || o.email),
    (0, class_validator_1.IsEmail)({}, { message: 'Invalid email format' }),
    __metadata("design:type", String)
], RegisterStep3Dto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User phone number (required if not provided in Step 1)',
        example: '+255712345678',
    }),
    (0, class_validator_1.ValidateIf)(o => !o.email || o.phone),
    (0, class_validator_1.IsPhoneNumber)(undefined, { message: 'Invalid phone number format' }),
    __metadata("design:type", String)
], RegisterStep3Dto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Date of birth in YYYY-MM-DD format (user must be 18+ years old)',
        example: '1990-05-15',
        format: 'date',
    }),
    (0, class_validator_1.IsDateString)({}, { message: 'Invalid date format. Use YYYY-MM-DD' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_transformer_1.Transform)(({ value }) => {
        const dob = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        const dayDiff = today.getDate() - dob.getDate();
        const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
        if (actualAge < 18) {
            throw new Error('User must be at least 18 years old');
        }
        return value;
    }),
    __metadata("design:type", String)
], RegisterStep3Dto.prototype, "dateOfBirth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Taxpayer Identification Number (TIN) - 9 to 12 alphanumeric characters',
        example: 'TZ123456789',
        minLength: 9,
        maxLength: 12,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(9, 12, {
        message: 'TIN number must be between 9 and 12 characters',
    }),
    (0, class_validator_1.Matches)(/^[A-Z0-9]+$/i, {
        message: 'TIN number must contain only alphanumeric characters',
    }),
    (0, class_transformer_1.Transform)(({ value }) => value?.toUpperCase()),
    __metadata("design:type", String)
], RegisterStep3Dto.prototype, "tinNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'National Identity (NIDA) number - exactly 20 digits',
        example: '19900515123456789012',
        minLength: 20,
        maxLength: 20,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(20, 20, { message: 'NIDA number must be exactly 20 digits' }),
    (0, class_validator_1.Matches)(/^\d{20}$/, {
        message: 'NIDA number must contain exactly 20 numeric digits',
    }),
    __metadata("design:type", String)
], RegisterStep3Dto.prototype, "nidaNumber", void 0);
//# sourceMappingURL=register-step3.dto.js.map