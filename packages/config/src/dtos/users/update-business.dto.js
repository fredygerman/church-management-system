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
exports.UpdateBusinessDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class UpdateBusinessDto {
}
exports.UpdateBusinessDto = UpdateBusinessDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Legal business name',
        example: 'Church Org',
        minLength: 2,
        maxLength: 255,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2, { message: 'Business name must be at least 2 characters' }),
    (0, class_validator_1.MaxLength)(255, {
        message: 'Business name must not exceed 255 characters',
    }),
    __metadata("design:type", String)
], UpdateBusinessDto.prototype, "businessName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Business registration number (6-20 alphanumeric characters and hyphens)',
        example: 'TZ-BRN-2023-001234',
        minLength: 6,
        maxLength: 20,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6, {
        message: 'Business registration number must be at least 6 characters',
    }),
    (0, class_validator_1.MaxLength)(20, {
        message: 'Business registration number must not exceed 20 characters',
    }),
    (0, class_validator_1.Matches)(/^[A-Z0-9-]+$/i, {
        message: 'Business registration number must contain only alphanumeric characters and hyphens',
    }),
    __metadata("design:type", String)
], UpdateBusinessDto.prototype, "businessRegistrationNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Country name',
        example: 'Tanzania',
        maxLength: 100,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1, { message: 'Country must not be empty' }),
    (0, class_validator_1.MaxLength)(100, { message: 'Country must not exceed 100 characters' }),
    __metadata("design:type", String)
], UpdateBusinessDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Region or state name',
        example: 'Dar es Salaam',
        maxLength: 100,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1, { message: 'Region must not be empty' }),
    (0, class_validator_1.MaxLength)(100, { message: 'Region must not exceed 100 characters' }),
    __metadata("design:type", String)
], UpdateBusinessDto.prototype, "region", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'District name',
        example: 'Kinondoni',
        maxLength: 100,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1, { message: 'District must not be empty' }),
    (0, class_validator_1.MaxLength)(100, { message: 'District must not exceed 100 characters' }),
    __metadata("design:type", String)
], UpdateBusinessDto.prototype, "district", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Street name and details',
        example: 'Msimbazi Street, Plot 123',
        maxLength: 255,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1, { message: 'Street must not be empty' }),
    (0, class_validator_1.MaxLength)(255, { message: 'Street must not exceed 255 characters' }),
    __metadata("design:type", String)
], UpdateBusinessDto.prototype, "street", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'House or building number',
        example: 'House 45A',
        maxLength: 50,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1, { message: 'House number must not be empty' }),
    (0, class_validator_1.MaxLength)(50, { message: 'House number must not exceed 50 characters' }),
    __metadata("design:type", String)
], UpdateBusinessDto.prototype, "houseNumber", void 0);
//# sourceMappingURL=update-business.dto.js.map