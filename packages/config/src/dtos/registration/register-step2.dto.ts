import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsNotEmpty,
  Length,
  ValidateIf,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for Step 2 - OTP Verification
 * Verify the OTP sent to email or phone in Step 1
 */
export class RegisterStep2Dto {
  @ApiProperty({
    description: 'User ID from Step 1 registration',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'Invalid user ID format' })
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: '6-digit OTP code sent to email or phone',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp: string;

  @ApiPropertyOptional({
    description: 'User email address (must match Step 1 email if provided)',
    example: 'john.doe@church.org',
  })
  @ValidateIf(o => !o.phone || o.email)
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @ApiPropertyOptional({
    description: 'User phone number (must match Step 1 phone if provided)',
    example: '+255712345678',
  })
  @ValidateIf(o => !o.email || o.phone)
  @IsPhoneNumber(undefined, { message: 'Invalid phone number format' })
  phone?: string;
}
