import {
  IsOptional,
  IsString,
  IsPhoneNumber,
  IsDateString,
  MinLength,
  MaxLength,
  Matches,
  IsUrl,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * DTO for updating user account details
 */
export class UpdateAccountDto {
  @ApiPropertyOptional({
    description: 'User full name',
    example: 'John Doe',
    minLength: 2,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Full name must be at least 2 characters' })
  @MaxLength(255, { message: 'Full name must not exceed 255 characters' })
  fullName?: string;

  @ApiPropertyOptional({
    description: 'User first name',
    example: 'John',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'First name must be at least 1 character' })
  @MaxLength(100, { message: 'First name must not exceed 100 characters' })
  firstName?: string;

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'Doe',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Last name must be at least 1 character' })
  @MaxLength(100, { message: 'Last name must not exceed 100 characters' })
  lastName?: string;

  @ApiPropertyOptional({
    description: 'User phone number in E.164 format',
    example: '+255712345678',
    pattern: '^\\+[1-9]\\d{1,14}$',
  })
  @IsOptional()
  @IsPhoneNumber(undefined, {
    message: 'Phone number must be in valid E.164 format',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Date of birth in YYYY-MM-DD format (must be 18+ years old)',
    example: '1990-05-15',
    format: 'date',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Date of birth must be in YYYY-MM-DD format' })
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description:
      'Taxpayer Identification Number (9-12 alphanumeric characters)',
    example: 'TZ123456789',
    minLength: 9,
    maxLength: 12,
  })
  @IsOptional()
  @IsString()
  @MinLength(9, { message: 'TIN number must be at least 9 characters' })
  @MaxLength(12, { message: 'TIN number must not exceed 12 characters' })
  @Matches(/^[A-Z0-9]+$/i, {
    message: 'TIN number must contain only alphanumeric characters',
  })
  @Transform(({ value }) => value?.toUpperCase())
  tinNumber?: string;

  @ApiPropertyOptional({
    description: 'National Identity (NIDA) number (exactly 20 digits)',
    example: '19900515123456789012',
    minLength: 20,
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MinLength(20, { message: 'NIDA number must be exactly 20 digits' })
  @MaxLength(20, { message: 'NIDA number must be exactly 20 digits' })
  @Matches(/^\d{20}$/, {
    message: 'NIDA number must contain exactly 20 numeric digits',
  })
  nidaNumber?: string;

  @ApiPropertyOptional({
    description:
      'Profile picture URL from S3 upload (must be from authorized S3 bucket)',
    example:
      'https://church-uploads.s3.amazonaws.com/profileImages/123456_profile.jpg',
    format: 'url',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Profile picture URL must be a valid URL' })
  profilePictureUrl?: string;
}
