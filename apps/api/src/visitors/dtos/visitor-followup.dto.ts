import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export const VISITOR_FOLLOWUP_STATUS = {
  NONE: 'none',
  CALLED: 'called',
  VISITED: 'visited',
  CONVERTED: 'converted',
  DROPPED: 'dropped',
} as const

export type VisitorFollowupStatus = (typeof VISITOR_FOLLOWUP_STATUS)[keyof typeof VISITOR_FOLLOWUP_STATUS]

export class CreateVisitorFollowupDto {
  @ApiProperty({
    description: 'Follow-up status',
    enum: Object.values(VISITOR_FOLLOWUP_STATUS),
  })
  @IsNotEmpty()
  @IsEnum(Object.values(VISITOR_FOLLOWUP_STATUS))
  status!: VisitorFollowupStatus

  @ApiPropertyOptional({
    description: 'Notes',
  })
  @IsOptional()
  @IsString()
  notes?: string

  @ApiPropertyOptional({
    description: 'Follow-up date',
  })
  @IsOptional()
  @IsDateString()
  followupDate?: string

  @ApiPropertyOptional({
    description: 'User ID who completed',
  })
  @IsOptional()
  @IsString()
  completedBy?: string
}

export class UpdateVisitorFollowupDto {
  @ApiPropertyOptional({
    description: 'Follow-up status',
    enum: Object.values(VISITOR_FOLLOWUP_STATUS),
  })
  @IsOptional()
  @IsEnum(Object.values(VISITOR_FOLLOWUP_STATUS))
  status?: VisitorFollowupStatus

  @ApiPropertyOptional({
    description: 'Notes',
  })
  @IsOptional()
  @IsString()
  notes?: string

  @ApiPropertyOptional({
    description: 'Follow-up date',
  })
  @IsOptional()
  @IsDateString()
  followupDate?: string
}
