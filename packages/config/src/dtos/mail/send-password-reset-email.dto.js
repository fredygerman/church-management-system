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
exports.SendPasswordResetEmailDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class SendPasswordResetEmailDto {
}
exports.SendPasswordResetEmailDto = SendPasswordResetEmailDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Recipient email address',
        example: 'user@example.com',
    }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], SendPasswordResetEmailDto.prototype, "to", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User name',
        example: 'John Doe',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendPasswordResetEmailDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Password reset URL',
        example: 'https://app.church.org/reset-password?token=abc123',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendPasswordResetEmailDto.prototype, "resetUrl", void 0);
//# sourceMappingURL=send-password-reset-email.dto.js.map