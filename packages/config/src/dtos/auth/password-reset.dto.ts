/**
 * Password reset DTOs for user authentication
 * Can be used across API and Web applications
 */

import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for requesting password reset
 */
export class RequestPasswordResetDto {
  @ApiPropertyOptional({
    description: 'User email address (required if phone is not provided)',
    example: 'john.doe@church.org',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  @ValidateIf(o => !o.phone || o.email)
  email?: string;

  @ApiPropertyOptional({
    description:
      'User phone number in international format (required if email is not provided)',
    example: '+255712345678',
    pattern: '^\\+?[1-9]\\d{1,14}$',
  })
  @IsString()
  @IsOptional()
  @ValidateIf(o => !o.email || o.phone)
  phone?: string;
}

/**
 * DTO for resetting password with OTP
 */
export class ResetPasswordDto {
  @ApiPropertyOptional({
    description: 'User email address (required if phone is not provided)',
    example: 'john.doe@church.org',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  @ValidateIf(o => !o.phone || o.email)
  email?: string;

  @ApiPropertyOptional({
    description:
      'User phone number in international format (required if email is not provided)',
    example: '+255712345678',
    pattern: '^\\+?[1-9]\\d{1,14}$',
  })
  @IsString()
  @IsOptional()
  @ValidateIf(o => !o.email || o.phone)
  phone?: string;

  @ApiProperty({
    description: '6-digit OTP code sent for password reset verification',
    example: '123456',
    minLength: 6,
    maxLength: 6,
    pattern: '^[0-9]{6}$',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  code: string;

  @ApiProperty({
    description:
      'New password (min 8 characters, must contain uppercase, lowercase, and number)',
    example: 'NewSecurePass123',
    minLength: 8,
    format: 'password',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  newPassword: string;
}

/**
 * Response DTO for password reset request (interface, no validation needed)
 */
export interface PasswordResetResponseDto {
  message: string;
}
