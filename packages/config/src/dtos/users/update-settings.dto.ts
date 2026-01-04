import { IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Preferred language enum for validation
 */
export enum PreferredLanguageEnum {
  EN = 'EN',
  SW = 'SW',
}

/**
 * DTO for updating user settings and preferences
 */
export class UpdateSettingsDto {
  @ApiPropertyOptional({
    description: 'Enable dark mode theme',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Dark mode must be a boolean value' })
  darkMode?: boolean;

  @ApiPropertyOptional({
    description: 'Enable push notifications',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Push notifications must be a boolean value' })
  pushNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Enable email alerts',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Email alerts must be a boolean value' })
  emailAlerts?: boolean;

  @ApiPropertyOptional({
    description: 'Enable SMS notifications',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'SMS notifications must be a boolean value' })
  smsNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Enable transaction notifications',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Transaction notifications must be a boolean value' })
  transactionNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Enable bill payment reminders',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Bill payment reminders must be a boolean value' })
  billPaymentReminders?: boolean;

  @ApiPropertyOptional({
    description: 'Preferred language for app interface',
    example: 'EN',
    enum: PreferredLanguageEnum,
  })
  @IsOptional()
  @IsEnum(PreferredLanguageEnum, {
    message: 'Preferred language must be either EN or SW',
  })
  preferredLanguage?: PreferredLanguageEnum;
}
