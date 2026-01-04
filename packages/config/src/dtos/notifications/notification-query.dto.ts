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
    enum: ['AUTH', 'ACCOUNT', 'ORDER', 'SHIPMENT', 'PAYMENT', 'SYSTEM', 'MARKETING'],
    example: 'ORDER',
  })
  @IsOptional()
  @IsEnum(['AUTH', 'ACCOUNT', 'ORDER', 'SHIPMENT', 'PAYMENT', 'SYSTEM', 'MARKETING'])
  category?: 'AUTH' | 'ACCOUNT' | 'ORDER' | 'SHIPMENT' | 'PAYMENT' | 'SYSTEM' | 'MARKETING';

  @ApiPropertyOptional({
    description: 'Filter by specific purpose',
    example: 'order_confirmed',
  })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional({
    description: 'Filter by notification type',
    enum: ['SMS', 'EMAIL', 'PUSH'],
    example: 'SMS',
  })
  @IsOptional()
  @IsEnum(['SMS', 'EMAIL', 'PUSH'])
  type?: 'SMS' | 'EMAIL' | 'PUSH';

  @ApiPropertyOptional({
    description: 'Filter by notification status',
    enum: ['PENDING', 'SENT', 'FAILED', 'DELIVERED'],
    example: 'SENT',
  })
  @IsOptional()
  @IsEnum(['PENDING', 'SENT', 'FAILED', 'DELIVERED'])
  status?: 'PENDING' | 'SENT' | 'FAILED' | 'DELIVERED';

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
    enum: ['AUTH', 'ACCOUNT', 'ORDER', 'SHIPMENT', 'PAYMENT', 'SYSTEM', 'MARKETING'],
    example: 'ORDER',
  })
  @IsOptional()
  @IsEnum(['AUTH', 'ACCOUNT', 'ORDER', 'SHIPMENT', 'PAYMENT', 'SYSTEM', 'MARKETING'])
  category?: 'AUTH' | 'ACCOUNT' | 'ORDER' | 'SHIPMENT' | 'PAYMENT' | 'SYSTEM' | 'MARKETING';

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
