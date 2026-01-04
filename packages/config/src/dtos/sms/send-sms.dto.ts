import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsObject,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { NotificationMetadata } from '../../types/notifications';

/**
 * DTO for sending SMS with validation
 * Can be used in NestJS controllers with automatic validation
 */
export class SendSmsDto {
  @ApiProperty({
    description: 'User ID (UUID) to associate the notification with',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID('4')
  userId!: string;

  @ApiProperty({
    description: 'Phone number in international format (e.g., +255745676696)',
    example: '+255745676696',
  })
  @IsNotEmpty()
  @IsString()
  to!: string;

  @ApiProperty({
    description: 'SMS message content',
    example: 'Your order #12345 has been confirmed and will be delivered soon.',
  })
  @IsNotEmpty()
  @IsString()
  message!: string;

  @ApiProperty({
    description: 'Notification category',
    enum: [
      'AUTH',
      'ACCOUNT',
      'ORDER',
      'SHIPMENT',
      'PAYMENT',
      'SYSTEM',
      'MARKETING',
    ],
    example: 'ORDER',
  })
  @IsNotEmpty()
  @IsEnum([
    'AUTH',
    'ACCOUNT',
    'ORDER',
    'SHIPMENT',
    'PAYMENT',
    'SYSTEM',
    'MARKETING',
  ])
  category:
    | 'AUTH'
    | 'ACCOUNT'
    | 'ORDER'
    | 'SHIPMENT'
    | 'PAYMENT'
    | 'SYSTEM'
    | 'MARKETING';

  @ApiProperty({
    description: 'Specific purpose of the notification (flexible string)',
    example: 'order_confirmed',
    examples: [
      'order_confirmed',
      'otp_verification',
      'shipment_update',
      'payment_success',
      'custom_notification',
    ],
  })
  @IsNotEmpty()
  @IsString()
  purpose: string;

  @ApiPropertyOptional({
    description: 'Optional subject/title for the notification',
    example: 'Order Confirmation',
  })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({
    description:
      'Whether to show this notification in the app notification center',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  showInApp?: boolean;

  @ApiPropertyOptional({
    description: 'Additional metadata for linking to orders, shipments, etc.',
    example: {
      orderId: 12345,
      shipmentId: 67890,
      deepLink: '/orders/12345',
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: NotificationMetadata;

  @ApiPropertyOptional({
    description:
      'Custom reference ID for tracking (auto-generated if not provided)',
    example: 'ORDER-12345-REF',
  })
  @IsOptional()
  @IsString()
  customReference?: string;
}
