import {
  IsOptional,
  IsUUID,
} from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

/**
 * DTO for converting a visitor to member
 */
export class ConvertVisitorToMemberDto {
  @ApiPropertyOptional({
    description: 'Zone ID to assign new member to',
  })
  @IsOptional()
  @IsUUID('4')
  zoneId?: string

  // Injected by ChurchContextGuard before validation runs; declared so the
  // whitelist pipe does not reject it.
  @IsOptional()
  @IsUUID('4')
  churchId?: string
}
