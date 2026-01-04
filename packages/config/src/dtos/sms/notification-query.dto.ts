import {
  IsOptional,
  IsNumber,
  IsEnum,
  IsString,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  NotificationCategory,
  NotificationType,
  NotificationStatus,
} from '../../schema/notifications.schema';
import { Type } from 'class-transformer';

/**
 * Query DTO for filtering notifications
 */
export class NotificationQueryDto {
  @ApiPropertyOptional({
    description: 'User ID to filter notifications',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  userId?: number;

  @ApiPropertyOptional({
    description: 'Filter by notification category',
    enum: Object.keys(NotificationCategory),
    example: 'ORDER',
  })
  @IsOptional()
  @IsEnum(Object.keys(NotificationCategory))
  category?: keyof typeof NotificationCategory;

  @ApiPropertyOptional({
    description: 'Filter by specific purpose',
    example: 'order_confirmed',
  })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional({
    description: 'Filter by notification type',
    enum: Object.keys(NotificationType),
    example: 'SMS',
  })
  @IsOptional()
  @IsEnum(Object.keys(NotificationType))
  type?: keyof typeof NotificationType;

  @ApiPropertyOptional({
    description: 'Filter by notification status',
    enum: Object.keys(NotificationStatus),
    example: 'SENT',
  })
  @IsOptional()
  @IsEnum(Object.keys(NotificationStatus))
  status?: keyof typeof NotificationStatus;

  @ApiPropertyOptional({
    description: 'Filter by showInApp flag',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  showInApp?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by read status',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isRead?: boolean;

  @ApiPropertyOptional({
    description: 'Number of results to return',
    example: 20,
    default: 50,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 50;

  @ApiPropertyOptional({
    description: 'Number of results to skip (for pagination)',
    example: 0,
    default: 0,
    minimum: 0,
  })
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
  @ApiPropertyOptional({
    description: 'Filter unread count by category',
    enum: Object.keys(NotificationCategory),
    example: 'ORDER',
  })
  @IsOptional()
  @IsEnum(Object.keys(NotificationCategory))
  category?: keyof typeof NotificationCategory;

  @ApiPropertyOptional({
    description: 'Only count in-app notifications',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  showInApp?: boolean = true;
}
