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
exports.ResetPasswordDto = exports.RequestPasswordResetDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class RequestPasswordResetDto {
}
exports.RequestPasswordResetDto = RequestPasswordResetDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User email address (required if phone is not provided)',
        example: 'john.doe@church.org',
        format: 'email',
    }),
    (0, class_validator_1.IsEmail)({}, { message: 'Please provide a valid email address' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)(o => !o.phone || o.email),
    __metadata("design:type", String)
], RequestPasswordResetDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User phone number in international format (required if email is not provided)',
        example: '+255712345678',
        pattern: '^\\+?[1-9]\\d{1,14}$',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)(o => !o.email || o.phone),
    __metadata("design:type", String)
], RequestPasswordResetDto.prototype, "phone", void 0);
class ResetPasswordDto {
}
exports.ResetPasswordDto = ResetPasswordDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User email address (required if phone is not provided)',
        example: 'john.doe@church.org',
        format: 'email',
    }),
    (0, class_validator_1.IsEmail)({}, { message: 'Please provide a valid email address' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)(o => !o.phone || o.email),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User phone number in international format (required if email is not provided)',
        example: '+255712345678',
        pattern: '^\\+?[1-9]\\d{1,14}$',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)(o => !o.email || o.phone),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '6-digit OTP code sent for password reset verification',
        example: '123456',
        minLength: 6,
        maxLength: 6,
        pattern: '^[0-9]{6}$',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'New password (min 8 characters, must contain uppercase, lowercase, and number)',
        example: 'NewSecurePass123',
        minLength: 8,
        format: 'password',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(8, { message: 'Password must be at least 8 characters long' }),
    (0, class_validator_1.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "newPassword", void 0);
//# sourceMappingURL=password-reset.dto.js.map