/**
 * Login DTOs for user authentication
 * Can be used across API and Web applications
 */

import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for user login
 */
export class LoginDto {
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
    description: 'User password',
    example: 'SecurePass123',
    minLength: 1,
    format: 'password',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

/**
 * DTO for refresh token request
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'JWT refresh token obtained from login or previous refresh',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTYzOTU4MjgwMCwiZXhwIjoxNjQwMTg3NjAwfQ.signature_here',
    format: 'jwt',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

/**
 * Response DTO for authentication tokens (interface, no validation needed)
 */
export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
}

/**
 * Response DTO for login/authentication (interface, no validation needed)
 */
export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    isActive: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
  };
}
