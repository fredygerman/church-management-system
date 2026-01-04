/**
 * Shared DTOs for notifications with validation
 * Can be used across API and Web applications
 *
 * These DTOs include class-validator decorators for use in NestJS
 * Web apps can import them as types without installing class-validator
 */

import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsObject,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import type {
  NotificationCategoryType,
  NotificationPurposeType,
  NotificationMetadata,
  NotificationTypeType,
  NotificationStatusType,
} from '../types/notifications';

// Enum values for validation
export enum NotificationCategoryEnum {
  AUTH = 'auth',
  ACCOUNT = 'account',
  ORDER = 'order',
  SHIPMENT = 'shipment',
  PAYMENT = 'payment',
  SYSTEM = 'system',
  MARKETING = 'marketing',
}

export enum NotificationTypeEnum {
  SMS = 'sms',
  EMAIL = 'email',
  PUSH = 'push',
}

export enum NotificationStatusEnum {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  DELIVERED = 'delivered',
}

/**
 * DTO for sending SMS with validation
 */
export class SendSmsDto {
  @IsNotEmpty()
  @IsString()
  @IsUUID('4')
  userId: string;

  @IsNotEmpty()
  @IsString()
  to: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsNotEmpty()
  @IsEnum(NotificationCategoryEnum)
  category: NotificationCategoryType;

  @IsNotEmpty()
  @IsString()
  purpose: NotificationPurposeType;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsBoolean()
  showInApp?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: NotificationMetadata;

  @IsOptional()
  @IsString()
  customReference?: string;
}

/**
 * DTO for marking notification as read
 */
export class MarkNotificationReadDto {
  @IsNotEmpty()
  @IsString()
  @IsUUID('4')
  notificationId: string;

  @IsNotEmpty()
  @IsString()
  @IsUUID('4')
  userId: string;
}

/**
 * DTO for marking all notifications as read
 */
export class MarkAllReadDto {
  @IsNotEmpty()
  @IsString()
  @IsUUID('4')
  userId: string;

  @IsOptional()
  @IsEnum(NotificationCategoryEnum)
  category?: NotificationCategoryType;
}

/**
 * Query DTO for filtering notifications
 */
export class NotificationQueryDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  userId?: number;

  @IsOptional()
  @IsEnum(NotificationCategoryEnum)
  category?: NotificationCategoryType;

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsOptional()
  @IsEnum(NotificationTypeEnum)
  type?: NotificationTypeType;

  @IsOptional()
  @IsEnum(NotificationStatusEnum)
  status?: NotificationStatusType;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  showInApp?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isRead?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 50;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}

/**
 * Query DTO for getting unread count
 */
export class UnreadCountQueryDto {
  @IsOptional()
  @IsEnum(NotificationCategoryEnum)
  category?: NotificationCategoryType;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  showInApp?: boolean = true;
}

/**
 * Response DTO for SMS operations (interface, no validation needed)
 */
export interface SmsResponseDto {
  success: boolean;
  reference: string;
  notificationId?: number;
  message?: string;
  error?: string;
  response?: any;
}

/**
 * Response DTO for unread count (interface, no validation needed)
 */
export interface UnreadCountResponseDto {
  count: number;
  userId: number;
  category?: NotificationCategoryType;
}
