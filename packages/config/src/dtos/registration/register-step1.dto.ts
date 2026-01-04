import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  MinLength,
  MaxLength,
  Matches,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for Step 1 - Basic Registration Information
 * User provides either email OR phone (at least one required)
 */
export class RegisterStep1Dto {
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Full name must be at least 2 characters' })
  @MaxLength(255, { message: 'Full name must not exceed 255 characters' })
  fullName: string;

  @ApiPropertyOptional({
    description: 'User email address (required if phone is not provided)',
    example: 'john.doe@church.org',
  })
  @ValidateIf(o => !o.phone || o.email)
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required when phone is not provided' })
  email?: string;

  @ApiPropertyOptional({
    description:
      'User phone number in international format (required if email is not provided)',
    example: '+255712345678',
  })
  @ValidateIf(o => !o.email || o.phone)
  @IsPhoneNumber(undefined, { message: 'Invalid phone number format' })
  @IsNotEmpty({ message: 'Phone is required when email is not provided' })
  phone?: string;

  @ApiProperty({
    description:
      'User password (min 8 characters, must contain uppercase, lowercase, and number)',
    example: 'SecurePass123',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;
}
