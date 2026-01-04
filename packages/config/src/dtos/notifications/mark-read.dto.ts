import { IsNotEmpty, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for marking a notification as read
 */
export class MarkNotificationReadDto {
  @ApiProperty({
    description: 'Notification ID to mark as read',
    example: 123,
  })
  @IsNotEmpty()
  @IsNumber()
  notificationId: number;

  @ApiProperty({
    description: 'User ID who owns the notification',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  userId: number;
}

/**
 * DTO for marking all notifications as read
 */
export class MarkAllReadDto {
  @ApiProperty({
    description: 'User ID',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @ApiPropertyOptional({
    description: 'Optional category filter - mark only notifications in this category as read',
    enum: ['AUTH', 'ACCOUNT', 'ORDER', 'SHIPMENT', 'PAYMENT', 'SYSTEM', 'MARKETING'],
    example: 'ORDER',
  })
  @IsOptional()
  @IsEnum(['AUTH', 'ACCOUNT', 'ORDER', 'SHIPMENT', 'PAYMENT', 'SYSTEM', 'MARKETING'])
  category?: 'AUTH' | 'ACCOUNT' | 'ORDER' | 'SHIPMENT' | 'PAYMENT' | 'SYSTEM' | 'MARKETING';
}
