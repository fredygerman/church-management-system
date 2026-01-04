import {
  IsString,
  IsNotEmpty,
  IsUUID,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for Step 4 - Business Profile & Documents
 * User provides business information and uploads required documents
 * File uploads are handled separately via multipart/form-data
 */
export class RegisterStep4Dto {
  @ApiProperty({
    description: 'User ID from previous registration step',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'Invalid user ID format' })
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Legal name of the business or company',
    example: 'Church Org',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255, { message: 'Business name must not exceed 255 characters' })
  businessName: string;

  @ApiProperty({
    description:
      'Official business registration number (6-20 alphanumeric characters and hyphens)',
    example: 'TZ-BRN-2023-001234',
    minLength: 6,
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 20, {
    message: 'Business registration number must be between 6 and 20 characters',
  })
  @Matches(/^[A-Z0-9-]+$/i, {
    message:
      'Business registration number must contain only alphanumeric characters and hyphens',
  })
  businessRegistrationNumber: string;
}

/**
 * Interface for uploaded document metadata
 * Used to validate files uploaded with Step 4
 */
export interface UploadedDocumentDto {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer?: Buffer;
}
