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
exports.UpdateSettingsDto = exports.PreferredLanguageEnum = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var PreferredLanguageEnum;
(function (PreferredLanguageEnum) {
    PreferredLanguageEnum["EN"] = "EN";
    PreferredLanguageEnum["SW"] = "SW";
})(PreferredLanguageEnum || (exports.PreferredLanguageEnum = PreferredLanguageEnum = {}));
class UpdateSettingsDto {
}
exports.UpdateSettingsDto = UpdateSettingsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Enable dark mode theme',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'Dark mode must be a boolean value' }),
    __metadata("design:type", Boolean)
], UpdateSettingsDto.prototype, "darkMode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Enable push notifications',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'Push notifications must be a boolean value' }),
    __metadata("design:type", Boolean)
], UpdateSettingsDto.prototype, "pushNotifications", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Enable email alerts',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'Email alerts must be a boolean value' }),
    __metadata("design:type", Boolean)
], UpdateSettingsDto.prototype, "emailAlerts", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Enable SMS notifications',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'SMS notifications must be a boolean value' }),
    __metadata("design:type", Boolean)
], UpdateSettingsDto.prototype, "smsNotifications", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Enable transaction notifications',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'Transaction notifications must be a boolean value' }),
    __metadata("design:type", Boolean)
], UpdateSettingsDto.prototype, "transactionNotifications", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Enable bill payment reminders',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'Bill payment reminders must be a boolean value' }),
    __metadata("design:type", Boolean)
], UpdateSettingsDto.prototype, "billPaymentReminders", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Preferred language for app interface',
        example: 'EN',
        enum: PreferredLanguageEnum,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(PreferredLanguageEnum, {
        message: 'Preferred language must be either EN or SW',
    }),
    __metadata("design:type", String)
], UpdateSettingsDto.prototype, "preferredLanguage", void 0);
//# sourceMappingURL=update-settings.dto.js.map