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
exports.RegisterStep1Dto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class RegisterStep1Dto {
}
exports.RegisterStep1Dto = RegisterStep1Dto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User full name',
        example: 'John Doe',
        minLength: 2,
        maxLength: 255,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(2, { message: 'Full name must be at least 2 characters' }),
    (0, class_validator_1.MaxLength)(255, { message: 'Full name must not exceed 255 characters' }),
    __metadata("design:type", String)
], RegisterStep1Dto.prototype, "fullName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User email address (required if phone is not provided)',
        example: 'john.doe@church.org',
    }),
    (0, class_validator_1.ValidateIf)(o => !o.phone || o.email),
    (0, class_validator_1.IsEmail)({}, { message: 'Invalid email format' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Email is required when phone is not provided' }),
    __metadata("design:type", String)
], RegisterStep1Dto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User phone number in international format (required if email is not provided)',
        example: '+255712345678',
    }),
    (0, class_validator_1.ValidateIf)(o => !o.email || o.phone),
    (0, class_validator_1.IsPhoneNumber)(undefined, { message: 'Invalid phone number format' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Phone is required when email is not provided' }),
    __metadata("design:type", String)
], RegisterStep1Dto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User password (min 8 characters, must contain uppercase, lowercase, and number)',
        example: 'SecurePass123',
        minLength: 8,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(8, { message: 'Password must be at least 8 characters' }),
    (0, class_validator_1.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),
    __metadata("design:type", String)
], RegisterStep1Dto.prototype, "password", void 0);
//# sourceMappingURL=register-step1.dto.js.map