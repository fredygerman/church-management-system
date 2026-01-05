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
exports.RegisterStep2Dto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class RegisterStep2Dto {
}
exports.RegisterStep2Dto = RegisterStep2Dto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User ID from Step 1 registration',
        example: '550e8400-e29b-41d4-a716-446655440000',
        format: 'uuid',
    }),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid user ID format' }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegisterStep2Dto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '6-digit OTP code sent to email or phone',
        example: '123456',
        minLength: 6,
        maxLength: 6,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(6, 6, { message: 'OTP must be exactly 6 digits' }),
    __metadata("design:type", String)
], RegisterStep2Dto.prototype, "otp", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User email address (must match Step 1 email if provided)',
        example: 'john.doe@church.org',
    }),
    (0, class_validator_1.ValidateIf)(o => !o.phone || o.email),
    (0, class_validator_1.IsEmail)({}, { message: 'Invalid email format' }),
    __metadata("design:type", String)
], RegisterStep2Dto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User phone number (must match Step 1 phone if provided)',
        example: '+255712345678',
    }),
    (0, class_validator_1.ValidateIf)(o => !o.email || o.phone),
    (0, class_validator_1.IsPhoneNumber)(undefined, { message: 'Invalid phone number format' }),
    __metadata("design:type", String)
], RegisterStep2Dto.prototype, "phone", void 0);
//# sourceMappingURL=register-step2.dto.js.map