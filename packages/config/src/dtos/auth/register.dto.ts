/**
 * Registration DTOs for user authentication
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
 * DTO for user registration
 */
export class RegisterDto {
  @ApiProperty({
    description: "User's first name",
    example: 'John',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: "User's last name",
    example: 'Doe',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({
    description: "User's email address (required if phone is not provided)",
    example: 'john.doe@church.org',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  @ValidateIf(o => !o.phone || o.email)
  email?: string;

  @ApiPropertyOptional({
    description:
      "User's phone number in international format (required if email is not provided)",
    example: '+255712345678',
    pattern: '^\\+?[1-9]\\d{1,14}$',
  })
  @IsString()
  @IsOptional()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone number must be a valid international format',
  })
  @ValidateIf(o => !o.email || o.phone)
  phone?: string;

  @ApiProperty({
    description:
      'User password (min 8 characters, must contain uppercase, lowercase, and number)',
    example: 'SecurePass123',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;
}

/**
 * DTO for OTP verification
 */
export class VerifyOtpDto {
  @ApiProperty({
    description: '6-digit OTP code sent to email or phone',
    example: '123456',
    minLength: 6,
    maxLength: 6,
    pattern: '^[0-9]{6}$',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  code: string;

  @ApiPropertyOptional({
    description: 'Email address (required if phone is not provided)',
    example: 'john.doe@church.org',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  @ValidateIf(o => !o.phone || o.email)
  email?: string;

  @ApiPropertyOptional({
    description: 'Phone number (required if email is not provided)',
    example: '+255712345678',
    pattern: '^\\+?[1-9]\\d{1,14}$',
  })
  @IsString()
  @IsOptional()
  @ValidateIf(o => !o.email || o.phone)
  phone?: string;
}

/**
 * Response DTO for registration (interface, no validation needed)
 */
export interface RegisterResponseDto {
  message: string;
  userId: string;
  requiresVerification: boolean;
}
