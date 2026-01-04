import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationCategory } from '../../schema/notifications.schema';

/**
 * DTO for marking a notification as read
 */
export class MarkNotificationReadDto {
  @ApiProperty({
    description: 'Notification ID (UUID) to mark as read',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID('4')
  notificationId: string;

  @ApiProperty({
    description: 'User ID (UUID) who owns the notification',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID('4')
  userId: string;
}

/**
 * DTO for marking all notifications as read
 */
export class MarkAllReadDto {
  @ApiProperty({
    description: 'User ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID('4')
  userId: string;

  @ApiPropertyOptional({
    description:
      'Optional category filter - mark only notifications in this category as read',
    enum: Object.keys(NotificationCategory),
    example: 'ORDER',
  })
  @IsOptional()
  @IsEnum(Object.keys(NotificationCategory))
  category?: keyof typeof NotificationCategory;
}
