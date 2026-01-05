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
exports.RegisterStep4Dto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class RegisterStep4Dto {
}
exports.RegisterStep4Dto = RegisterStep4Dto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User ID from previous registration step',
        example: '550e8400-e29b-41d4-a716-446655440000',
        format: 'uuid',
    }),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid user ID format' }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegisterStep4Dto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Legal name of the business or company',
        example: 'Church Org',
        maxLength: 255,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(255, { message: 'Business name must not exceed 255 characters' }),
    __metadata("design:type", String)
], RegisterStep4Dto.prototype, "businessName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Official business registration number (6-20 alphanumeric characters and hyphens)',
        example: 'TZ-BRN-2023-001234',
        minLength: 6,
        maxLength: 20,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(6, 20, {
        message: 'Business registration number must be between 6 and 20 characters',
    }),
    (0, class_validator_1.Matches)(/^[A-Z0-9-]+$/i, {
        message: 'Business registration number must contain only alphanumeric characters and hyphens',
    }),
    __metadata("design:type", String)
], RegisterStep4Dto.prototype, "businessRegistrationNumber", void 0);
//# sourceMappingURL=register-step4.dto.js.map