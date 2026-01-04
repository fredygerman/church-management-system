import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsNotEmpty,
  ValidateIf,
  IsUUID,
  IsDateString,
  Matches,
  Length,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for Step 3 - Additional Details
 * User provides the missing contact (email OR phone), DOB, TIN, and NIDA
 */
export class RegisterStep3Dto {
  @ApiProperty({
    description: 'User ID from previous registration step',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'Invalid user ID format' })
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({
    description: 'User email address (required if not provided in Step 1)',
    example: 'john.doe@church.org',
  })
  @ValidateIf(o => !o.phone || o.email)
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @ApiPropertyOptional({
    description: 'User phone number (required if not provided in Step 1)',
    example: '+255712345678',
  })
  @ValidateIf(o => !o.email || o.phone)
  @IsPhoneNumber(undefined, { message: 'Invalid phone number format' })
  phone?: string;

  @ApiProperty({
    description:
      'Date of birth in YYYY-MM-DD format (user must be 18+ years old)',
    example: '1990-05-15',
    format: 'date',
  })
  @IsDateString({}, { message: 'Invalid date format. Use YYYY-MM-DD' })
  @IsNotEmpty()
  @Transform(({ value }) => {
    // Validate user is 18+ years old
    const dob = new Date(value);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    const dayDiff = today.getDate() - dob.getDate();

    const actualAge =
      monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    if (actualAge < 18) {
      throw new Error('User must be at least 18 years old');
    }

    return value;
  })
  dateOfBirth: string;

  @ApiProperty({
    description:
      'Taxpayer Identification Number (TIN) - 9 to 12 alphanumeric characters',
    example: 'TZ123456789',
    minLength: 9,
    maxLength: 12,
  })
  @IsString()
  @IsNotEmpty()
  @Length(9, 12, {
    message: 'TIN number must be between 9 and 12 characters',
  })
  @Matches(/^[A-Z0-9]+$/i, {
    message: 'TIN number must contain only alphanumeric characters',
  })
  @Transform(({ value }) => value?.toUpperCase())
  tinNumber: string;

  @ApiProperty({
    description: 'National Identity (NIDA) number - exactly 20 digits',
    example: '19900515123456789012',
    minLength: 20,
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @Length(20, 20, { message: 'NIDA number must be exactly 20 digits' })
  @Matches(/^\d{20}$/, {
    message: 'NIDA number must contain exactly 20 numeric digits',
  })
  nidaNumber: string;
}
