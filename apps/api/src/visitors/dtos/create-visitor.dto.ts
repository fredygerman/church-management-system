import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsEmail,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export const VISITOR_SOURCE = {
  FRIEND: 'friend',
  FLYER: 'flyer',
  WALK_IN: 'walk_in',
  EVENT: 'event',
  REFERRAL: 'referral',
  SOCIAL_MEDIA: 'social_media',
  OTHER: 'other',
} as const

export type VisitorSource = (typeof VISITOR_SOURCE)[keyof typeof VISITOR_SOURCE]

/**
 * DTO for creating a new visitor entry
 */
export class CreateVisitorDto {
  @ApiProperty({
    description: 'Church ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsUUID('4')
  churchId!: string

  @ApiProperty({
    description: "Visitor's first name",
    example: 'John',
  })
  @IsNotEmpty()
  @IsString()
  firstName!: string

  @ApiProperty({
    description: "Visitor's last name",
    example: 'Doe',
  })
  @IsNotEmpty()
  @IsString()
  lastName!: string

  @ApiPropertyOptional({
    description: "Visitor's phone number",
    example: '+255745676696',
  })
  @IsOptional()
  @IsString()
  phone?: string

  @ApiPropertyOptional({
    description: "Visitor's email",
    example: 'john@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiPropertyOptional({
    description: 'Date of visit',
    example: '2026-01-15',
  })
  @IsOptional()
  @IsDateString()
  visitDate?: string

  @ApiPropertyOptional({
    description: 'How visitor found us',
    enum: Object.values(VISITOR_SOURCE),
    default: 'walk_in',
  })
  @IsOptional()
  @IsEnum(Object.values(VISITOR_SOURCE))
  visitorSource?: VisitorSource

  @ApiPropertyOptional({
    description: 'Member ID who referred this visitor',
  })
  @IsOptional()
  @IsUUID('4')
  referredByMemberId?: string
}
