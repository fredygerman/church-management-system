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
exports.RegisterStep5Dto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class RegisterStep5Dto {
}
exports.RegisterStep5Dto = RegisterStep5Dto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User ID from previous registration step',
        example: '550e8400-e29b-41d4-a716-446655440000',
        format: 'uuid',
    }),
    (0, class_validator_1.IsUUID)('4', { message: 'Invalid user ID format' }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegisterStep5Dto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Country name',
        example: 'Tanzania',
        maxLength: 100,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Country is required' }),
    (0, class_validator_1.MaxLength)(100, { message: 'Country must not exceed 100 characters' }),
    __metadata("design:type", String)
], RegisterStep5Dto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Region or state name',
        example: 'Dar es Salaam',
        maxLength: 100,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Region is required' }),
    (0, class_validator_1.MaxLength)(100, { message: 'Region must not exceed 100 characters' }),
    __metadata("design:type", String)
], RegisterStep5Dto.prototype, "region", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'District name',
        example: 'Kinondoni',
        maxLength: 100,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'District is required' }),
    (0, class_validator_1.MaxLength)(100, { message: 'District must not exceed 100 characters' }),
    __metadata("design:type", String)
], RegisterStep5Dto.prototype, "district", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Street name and details',
        example: 'Msimbazi Street, Plot 123',
        maxLength: 255,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Street is required' }),
    (0, class_validator_1.MaxLength)(255, { message: 'Street must not exceed 255 characters' }),
    __metadata("design:type", String)
], RegisterStep5Dto.prototype, "street", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'House or building number',
        example: 'House 45A',
        maxLength: 50,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'House number is required' }),
    (0, class_validator_1.MaxLength)(50, { message: 'House number must not exceed 50 characters' }),
    __metadata("design:type", String)
], RegisterStep5Dto.prototype, "houseNumber", void 0);
//# sourceMappingURL=register-step5.dto.js.map