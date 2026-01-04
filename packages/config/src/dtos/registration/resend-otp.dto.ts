import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsNotEmpty,
  ValidateIf,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for Resending OTP
 * User can request a new OTP for registration or password reset
 */
export class ResendOtpDto {
  @ApiProperty({
    description: 'User ID from previous registration step',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'Invalid user ID format' })
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({
    description: 'User email address (required if phone is not provided)',
    example: 'john.doe@church.org',
  })
  @ValidateIf(o => !o.phone || o.email)
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @ApiPropertyOptional({
    description: 'User phone number (required if email is not provided)',
    example: '+255712345678',
  })
  @ValidateIf(o => !o.email || o.phone)
  @IsPhoneNumber(undefined, { message: 'Invalid phone number format' })
  phone?: string;

  @ApiProperty({
    description: 'Purpose of the OTP request',
    example: 'REGISTRATION',
    enum: ['REGISTRATION', 'PASSWORD_RESET'],
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(['REGISTRATION', 'PASSWORD_RESET'], {
    message: 'Purpose must be either REGISTRATION or PASSWORD_RESET',
  })
  purpose: 'REGISTRATION' | 'PASSWORD_RESET';
}
