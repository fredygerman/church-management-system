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
exports.ResendOtpDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class ResendOtpDto {
}
exports.ResendOtpDto = ResendOtpDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User ID from previous registration step',
        example: '550e8400-e29b-41d4-a716-446655440000',
        format: 'uuid',
    }),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid user ID format' }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ResendOtpDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User email address (required if phone is not provided)',
        example: 'john.doe@church.org',
    }),
    (0, class_validator_1.ValidateIf)(o => !o.phone || o.email),
    (0, class_validator_1.IsEmail)({}, { message: 'Invalid email format' }),
    __metadata("design:type", String)
], ResendOtpDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User phone number (required if email is not provided)',
        example: '+255712345678',
    }),
    (0, class_validator_1.ValidateIf)(o => !o.email || o.phone),
    (0, class_validator_1.IsPhoneNumber)(undefined, { message: 'Invalid phone number format' }),
    __metadata("design:type", String)
], ResendOtpDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Purpose of the OTP request',
        example: 'REGISTRATION',
        enum: ['REGISTRATION', 'PASSWORD_RESET'],
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(['REGISTRATION', 'PASSWORD_RESET'], {
        message: 'Purpose must be either REGISTRATION or PASSWORD_RESET',
    }),
    __metadata("design:type", String)
], ResendOtpDto.prototype, "purpose", void 0);
//# sourceMappingURL=resend-otp.dto.js.map