import {
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for updating customer business details
 */
export class UpdateBusinessDto {
  @ApiPropertyOptional({
    description: 'Legal business name',
    example: 'Church Org',
    minLength: 2,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Business name must be at least 2 characters' })
  @MaxLength(255, {
    message: 'Business name must not exceed 255 characters',
  })
  businessName?: string;

  @ApiPropertyOptional({
    description:
      'Business registration number (6-20 alphanumeric characters and hyphens)',
    example: 'TZ-BRN-2023-001234',
    minLength: 6,
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MinLength(6, {
    message: 'Business registration number must be at least 6 characters',
  })
  @MaxLength(20, {
    message: 'Business registration number must not exceed 20 characters',
  })
  @Matches(/^[A-Z0-9-]+$/i, {
    message:
      'Business registration number must contain only alphanumeric characters and hyphens',
  })
  businessRegistrationNumber?: string;

  @ApiPropertyOptional({
    description: 'Country name',
    example: 'Tanzania',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Country must not be empty' })
  @MaxLength(100, { message: 'Country must not exceed 100 characters' })
  country?: string;

  @ApiPropertyOptional({
    description: 'Region or state name',
    example: 'Dar es Salaam',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Region must not be empty' })
  @MaxLength(100, { message: 'Region must not exceed 100 characters' })
  region?: string;

  @ApiPropertyOptional({
    description: 'District name',
    example: 'Kinondoni',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'District must not be empty' })
  @MaxLength(100, { message: 'District must not exceed 100 characters' })
  district?: string;

  @ApiPropertyOptional({
    description: 'Street name and details',
    example: 'Msimbazi Street, Plot 123',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Street must not be empty' })
  @MaxLength(255, { message: 'Street must not exceed 255 characters' })
  street?: string;

  @ApiPropertyOptional({
    description: 'House or building number',
    example: 'House 45A',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'House number must not be empty' })
  @MaxLength(50, { message: 'House number must not exceed 50 characters' })
  houseNumber?: string;
}
