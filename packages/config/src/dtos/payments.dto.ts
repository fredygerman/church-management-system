import {
  IsString,
  IsEmail,
  IsNumber,
  IsOptional,
  IsUUID,
  Matches,
  Min,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for user-initiated payment (simplified - only userId and amount)
 * User details are automatically fetched from the database
 */
export class CreatePaymentDto {
  @ApiProperty({
    description: 'User ID (UUID) from the users table',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsUUID('4', { message: 'userId must be a valid UUID' })
  userId: string;

  @ApiProperty({
    description: 'Transaction amount in TZS (no decimals)',
    example: 1000,
    minimum: 1,
  })
  @IsNumber({}, { message: 'amount must be a number' })
  @Min(1, { message: 'amount must be at least 1 TZS' })
  amount: number;
}

/**
 * DTO for manual/test payment initiation (full control over all fields)
 * This bypasses user lookup and allows manual entry of all details
 * Useful for testing without requiring a user account
 */
export class ManualPaymentDto {
  @ApiProperty({
    description: "Payer's valid email address",
    example: 'customer@example.com',
  })
  @IsEmail({}, { message: 'buyer_email must be a valid email address' })
  buyer_email: string;

  @ApiProperty({
    description: "Payer's full name (no special characters)",
    example: 'John Doe',
  })
  @IsString()
  @Matches(/^[a-zA-Z\s]+$/, {
    message: 'buyer_name should only contain letters and spaces',
  })
  buyer_name: string;

  @ApiProperty({
    description: 'Tanzanian mobile number (format: 07XXXXXXXX)',
    example: '0744963858',
  })
  @IsString()
  @Matches(/^07\d{8}$/, {
    message: 'buyer_phone must be a valid Tanzanian mobile number (07XXXXXXXX)',
  })
  buyer_phone: string;

  @ApiProperty({
    description: 'Transaction amount in TZS (no decimals)',
    example: 1000,
    minimum: 1,
  })
  @IsNumber({}, { message: 'amount must be a number' })
  @Min(1, { message: 'amount must be at least 1 TZS' })
  amount: number;

  @ApiPropertyOptional({
    description:
      'Optional user ID (UUID) to associate this payment with a user',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  @IsUUID('4', { message: 'userId must be a valid UUID' })
  userId?: string;
}

/**
 * Internal DTO for initiating payment with ZenoPay API
 * This is used internally after gathering user details
 */
export class InitiatePaymentDto {
  @IsString()
  @IsUUID('4', { message: 'order_id must be a valid UUID' })
  order_id: string;

  @IsEmail({}, { message: 'buyer_email must be a valid email address' })
  buyer_email: string;

  @IsString()
  @Matches(/^[a-zA-Z\s]+$/, {
    message: 'buyer_name should only contain letters and spaces',
  })
  buyer_name: string;

  @IsString()
  @Matches(/^07\d{8}$/, {
    message: 'buyer_phone must be a valid Tanzanian mobile number (07XXXXXXXX)',
  })
  buyer_phone: string;

  @IsNumber({}, { message: 'amount must be a number' })
  @Min(1, { message: 'amount must be at least 1 TZS' })
  amount: number;

  @IsOptional()
  @IsString()
  webhook_url?: string;
}

/**
 * DTO for payment initiation response
 */
export class PaymentResponseDto {
  @ApiProperty({ example: 'success' })
  status: string;

  @ApiProperty({ example: '000' })
  resultcode: string;

  @ApiProperty({
    example: 'Request in progress. You will receive a callback shortly',
  })
  message: string;

  @ApiProperty({ example: '3rer407fe-3ee8-4525-456f-ccb95de38250' })
  order_id: string;
}

/**
 * DTO for order status response
 */
export class OrderStatusDto {
  @ApiProperty({ example: '0936183435' })
  reference: string;

  @ApiProperty({ example: '000' })
  resultcode: string;

  @ApiProperty({ example: 'SUCCESS' })
  result: string;

  @ApiProperty({ example: 'Order fetch successful' })
  message: string;

  @ApiProperty({
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
  })
  data: Array<{
    order_id: string;
    creation_date: string;
    amount: string;
    payment_status: string;
    transid: string;
    channel: string;
    reference: string;
    msisdn: string;
  }>;
}

/**
 * DTO for webhook notification payload
 */
export class WebhookPayloadDto {
  @ApiProperty({ example: '677e43274d7cb' })
  @IsString()
  order_id: string;

  @ApiProperty({ example: 'COMPLETED' })
  @IsString()
  payment_status: string;

  @ApiProperty({ example: '1003020496' })
  @IsString()
  reference: string;

  @ApiProperty({ example: {} })
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * DTO for error responses
 */
export class ErrorResponseDto {
  @ApiProperty({ example: 'error' })
  status: string;

  @ApiProperty({ example: 'Invalid request payload' })
  message: string;
}
