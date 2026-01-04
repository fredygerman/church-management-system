import { IsString, IsNotEmpty, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for Step 5 - Address Details
 * User provides complete address information to complete registration
 */
export class RegisterStep5Dto {
  @ApiProperty({
    description: 'User ID from previous registration step',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'Invalid user ID format' })
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Country name',
    example: 'Tanzania',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'Country is required' })
  @MaxLength(100, { message: 'Country must not exceed 100 characters' })
  country: string;

  @ApiProperty({
    description: 'Region or state name',
    example: 'Dar es Salaam',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'Region is required' })
  @MaxLength(100, { message: 'Region must not exceed 100 characters' })
  region: string;

  @ApiProperty({
    description: 'District name',
    example: 'Kinondoni',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'District is required' })
  @MaxLength(100, { message: 'District must not exceed 100 characters' })
  district: string;

  @ApiProperty({
    description: 'Street name and details',
    example: 'Msimbazi Street, Plot 123',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty({ message: 'Street is required' })
  @MaxLength(255, { message: 'Street must not exceed 255 characters' })
  street: string;

  @ApiProperty({
    description: 'House or building number',
    example: 'House 45A',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: 'House number is required' })
  @MaxLength(50, { message: 'House number must not exceed 50 characters' })
  houseNumber: string;
}
