import { IsArray, IsDefined, IsIn, IsISO8601, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

// ChurchContextGuard writes churchId into the body before ValidationPipe runs, so every DTO declares it.
// The service ignores the body value and always uses the tenant the guard validated.

export class CreateAnnouncementDto {
  @ApiPropertyOptional({ description: 'Injected by ChurchContextGuard' })
  @IsOptional()
  @IsUUID('4')
  churchId?: string

  @ApiProperty({ maxLength: 120 })
  @IsString()
  @MaxLength(120)
  title!: string

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  summary?: string

  @ApiPropertyOptional({ enum: ['doc_v1'], default: 'doc_v1' })
  @IsOptional()
  @IsIn(['doc_v1'])
  bodyFormat?: 'doc_v1'

  @ApiProperty({ description: 'doc_v1 document tree (see doc-v1.validator.ts)' })
  @IsDefined()
  @IsObject()
  body!: Record<string, unknown>

  @ApiPropertyOptional({ enum: ['in_app', 'email', 'sms'], isArray: true, description: 'in_app is always included' })
  @IsOptional()
  @IsArray()
  channels?: string[]

  @ApiPropertyOptional({ description: '{ allMembers } or { zoneIds, genders, maritalStatuses }' })
  @IsOptional()
  @IsObject()
  audience?: Record<string, unknown>

  @ApiPropertyOptional({ maxLength: 2000, description: 'Checked against the SMS length cap' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  smsBody?: string

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  expiresAt?: string
}

export class UpdateAnnouncementDto {
  @ApiPropertyOptional({ description: 'Injected by ChurchContextGuard' })
  @IsOptional()
  @IsUUID('4')
  churchId?: string

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  summary?: string | null

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  body?: Record<string, unknown>

  @ApiPropertyOptional({ enum: ['in_app', 'email', 'sms'], isArray: true })
  @IsOptional()
  @IsArray()
  channels?: string[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  audience?: Record<string, unknown>

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  smsBody?: string | null

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  @IsOptional()
  @IsISO8601()
  expiresAt?: string | null
}

export class ScheduleAnnouncementDto {
  @ApiPropertyOptional({ description: 'Injected by ChurchContextGuard' })
  @IsOptional()
  @IsUUID('4')
  churchId?: string

  @ApiProperty({ format: 'date-time', description: 'At least 60 seconds from now' })
  @IsDefined()
  @IsISO8601()
  scheduledAt!: string
}
