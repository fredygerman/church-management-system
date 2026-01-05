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
exports.ErrorResponseDto = exports.WebhookPayloadDto = exports.OrderStatusDto = exports.PaymentResponseDto = exports.InitiatePaymentDto = exports.ManualPaymentDto = exports.CreatePaymentDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreatePaymentDto {
}
exports.CreatePaymentDto = CreatePaymentDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User ID (UUID) from the users table',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)('4', { message: 'userId must be a valid UUID' }),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Transaction amount in TZS (no decimals)',
        example: 1000,
        minimum: 1,
    }),
    (0, class_validator_1.IsNumber)({}, { message: 'amount must be a number' }),
    (0, class_validator_1.Min)(1, { message: 'amount must be at least 1 TZS' }),
    __metadata("design:type", Number)
], CreatePaymentDto.prototype, "amount", void 0);
class ManualPaymentDto {
}
exports.ManualPaymentDto = ManualPaymentDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Payer's valid email address",
        example: 'customer@example.com',
    }),
    (0, class_validator_1.IsEmail)({}, { message: 'buyer_email must be a valid email address' }),
    __metadata("design:type", String)
], ManualPaymentDto.prototype, "buyer_email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Payer's full name (no special characters)",
        example: 'John Doe',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[a-zA-Z\s]+$/, {
        message: 'buyer_name should only contain letters and spaces',
    }),
    __metadata("design:type", String)
], ManualPaymentDto.prototype, "buyer_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Tanzanian mobile number (format: 07XXXXXXXX)',
        example: '0744963858',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^07\d{8}$/, {
        message: 'buyer_phone must be a valid Tanzanian mobile number (07XXXXXXXX)',
    }),
    __metadata("design:type", String)
], ManualPaymentDto.prototype, "buyer_phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Transaction amount in TZS (no decimals)',
        example: 1000,
        minimum: 1,
    }),
    (0, class_validator_1.IsNumber)({}, { message: 'amount must be a number' }),
    (0, class_validator_1.Min)(1, { message: 'amount must be at least 1 TZS' }),
    __metadata("design:type", Number)
], ManualPaymentDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Optional user ID (UUID) to associate this payment with a user',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)('4', { message: 'userId must be a valid UUID' }),
    __metadata("design:type", String)
], ManualPaymentDto.prototype, "userId", void 0);
class InitiatePaymentDto {
}
exports.InitiatePaymentDto = InitiatePaymentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)('4', { message: 'order_id must be a valid UUID' }),
    __metadata("design:type", String)
], InitiatePaymentDto.prototype, "order_id", void 0);
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: 'buyer_email must be a valid email address' }),
    __metadata("design:type", String)
], InitiatePaymentDto.prototype, "buyer_email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[a-zA-Z\s]+$/, {
        message: 'buyer_name should only contain letters and spaces',
    }),
    __metadata("design:type", String)
], InitiatePaymentDto.prototype, "buyer_name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^07\d{8}$/, {
        message: 'buyer_phone must be a valid Tanzanian mobile number (07XXXXXXXX)',
    }),
    __metadata("design:type", String)
], InitiatePaymentDto.prototype, "buyer_phone", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'amount must be a number' }),
    (0, class_validator_1.Min)(1, { message: 'amount must be at least 1 TZS' }),
    __metadata("design:type", Number)
], InitiatePaymentDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InitiatePaymentDto.prototype, "webhook_url", void 0);
class PaymentResponseDto {
}
exports.PaymentResponseDto = PaymentResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'success' }),
    __metadata("design:type", String)
], PaymentResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '000' }),
    __metadata("design:type", String)
], PaymentResponseDto.prototype, "resultcode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Request in progress. You will receive a callback shortly',
    }),
    __metadata("design:type", String)
], PaymentResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '3rer407fe-3ee8-4525-456f-ccb95de38250' }),
    __metadata("design:type", String)
], PaymentResponseDto.prototype, "order_id", void 0);
class OrderStatusDto {
}
exports.OrderStatusDto = OrderStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '0936183435' }),
    __metadata("design:type", String)
], OrderStatusDto.prototype, "reference", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '000' }),
    __metadata("design:type", String)
], OrderStatusDto.prototype, "resultcode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'SUCCESS' }),
    __metadata("design:type", String)
], OrderStatusDto.prototype, "result", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Order fetch successful' }),
    __metadata("design:type", String)
], OrderStatusDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: 'array',
        items: {
            type: 'object',
            properties: {
                order_id: {
                    type: 'string',
                    example: '3rer407fe-3ee8-4525-456f-ccb95de38250',
                },
                creation_date: { type: 'string', example: '2025-05-19 08:40:33' },
                amount: { type: 'string', example: '1000' },
                payment_status: { type: 'string', example: 'COMPLETED' },
                transid: { type: 'string', example: 'CEJ3I3SETSN' },
                channel: { type: 'string', example: 'MPESA-TZ' },
                reference: { type: 'string', example: '0936183435' },
                msisdn: { type: 'string', example: '255744963858' },
            },
        },
    }),
    __metadata("design:type", Array)
], OrderStatusDto.prototype, "data", void 0);
class WebhookPayloadDto {
}
exports.WebhookPayloadDto = WebhookPayloadDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '677e43274d7cb' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WebhookPayloadDto.prototype, "order_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'COMPLETED' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WebhookPayloadDto.prototype, "payment_status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1003020496' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WebhookPayloadDto.prototype, "reference", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: {} }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], WebhookPayloadDto.prototype, "metadata", void 0);
class ErrorResponseDto {
}
exports.ErrorResponseDto = ErrorResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'error' }),
    __metadata("design:type", String)
], ErrorResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Invalid request payload' }),
    __metadata("design:type", String)
], ErrorResponseDto.prototype, "message", void 0);
//# sourceMappingURL=payments.dto.js.map