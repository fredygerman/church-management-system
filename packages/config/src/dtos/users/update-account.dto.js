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
exports.UpdateAccountDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class UpdateAccountDto {
}
exports.UpdateAccountDto = UpdateAccountDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User full name',
        example: 'John Doe',
        minLength: 2,
        maxLength: 255,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2, { message: 'Full name must be at least 2 characters' }),
    (0, class_validator_1.MaxLength)(255, { message: 'Full name must not exceed 255 characters' }),
    __metadata("design:type", String)
], UpdateAccountDto.prototype, "fullName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User first name',
        example: 'John',
        minLength: 1,
        maxLength: 100,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1, { message: 'First name must be at least 1 character' }),
    (0, class_validator_1.MaxLength)(100, { message: 'First name must not exceed 100 characters' }),
    __metadata("design:type", String)
], UpdateAccountDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User last name',
        example: 'Doe',
        minLength: 1,
        maxLength: 100,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1, { message: 'Last name must be at least 1 character' }),
    (0, class_validator_1.MaxLength)(100, { message: 'Last name must not exceed 100 characters' }),
    __metadata("design:type", String)
], UpdateAccountDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User phone number in E.164 format',
        example: '+255712345678',
        pattern: '^\\+[1-9]\\d{1,14}$',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsPhoneNumber)(undefined, {
        message: 'Phone number must be in valid E.164 format',
    }),
    __metadata("design:type", String)
], UpdateAccountDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Date of birth in YYYY-MM-DD format (must be 18+ years old)',
        example: '1990-05-15',
        format: 'date',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Date of birth must be in YYYY-MM-DD format' }),
    __metadata("design:type", String)
], UpdateAccountDto.prototype, "dateOfBirth", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Taxpayer Identification Number (9-12 alphanumeric characters)',
        example: 'TZ123456789',
        minLength: 9,
        maxLength: 12,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(9, { message: 'TIN number must be at least 9 characters' }),
    (0, class_validator_1.MaxLength)(12, { message: 'TIN number must not exceed 12 characters' }),
    (0, class_validator_1.Matches)(/^[A-Z0-9]+$/i, {
        message: 'TIN number must contain only alphanumeric characters',
    }),
    (0, class_transformer_1.Transform)(({ value }) => value?.toUpperCase()),
    __metadata("design:type", String)
], UpdateAccountDto.prototype, "tinNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'National Identity (NIDA) number (exactly 20 digits)',
        example: '19900515123456789012',
        minLength: 20,
        maxLength: 20,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(20, { message: 'NIDA number must be exactly 20 digits' }),
    (0, class_validator_1.MaxLength)(20, { message: 'NIDA number must be exactly 20 digits' }),
    (0, class_validator_1.Matches)(/^\d{20}$/, {
        message: 'NIDA number must contain exactly 20 numeric digits',
    }),
    __metadata("design:type", String)
], UpdateAccountDto.prototype, "nidaNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Profile picture URL from S3 upload (must be from authorized S3 bucket)',
        example: 'https://church-uploads.s3.amazonaws.com/profileImages/123456_profile.jpg',
        format: 'url',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({}, { message: 'Profile picture URL must be a valid URL' }),
    __metadata("design:type", String)
], UpdateAccountDto.prototype, "profilePictureUrl", void 0);
//# sourceMappingURL=update-account.dto.js.map