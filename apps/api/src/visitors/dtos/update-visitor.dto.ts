import {
  IsOptional,
  IsString,
  IsEnum,
  IsUUID,
  IsDateString,
  IsEmail,
} from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { VISITOR_SOURCE, type VisitorSource } from './create-visitor.dto'

export class UpdateVisitorDto {
  @ApiPropertyOptional({
    description: "Visitor's first name",
  })
  @IsOptional()
  @IsString()
  firstName?: string

  @ApiPropertyOptional({
    description: "Visitor's last name",
  })
  @IsOptional()
  @IsString()
  lastName?: string

  @ApiPropertyOptional({
    description: "Visitor's phone",
  })
  @IsOptional()
  @IsString()
  phone?: string

  @ApiPropertyOptional({
    description: "Visitor's email",
  })
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiPropertyOptional({
    description: 'How visitor found us',
    enum: Object.values(VISITOR_SOURCE),
  })
  @IsOptional()
  @IsEnum(Object.values(VISITOR_SOURCE))
  visitorSource?: VisitorSource

  @ApiPropertyOptional({
    description: 'Member ID who referred',
  })
  @IsOptional()
  @IsUUID('4')
  referredByMemberId?: string
}
