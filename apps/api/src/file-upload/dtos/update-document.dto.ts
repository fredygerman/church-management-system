import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateDocumentDto {
  @ApiPropertyOptional({ description: 'Document title' })
  @IsOptional()
  @IsString()
  title?: string

  @ApiPropertyOptional({ description: 'Document description' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({
    description: 'Whether members can see the document (same flag as upload metadata visibleToMembers)',
  })
  @IsOptional()
  @IsBoolean()
  visibleToMembers?: boolean

  // Injected by ChurchContextGuard before validation runs; declared so the
  // whitelist pipe does not reject it.
  @IsOptional()
  @IsUUID('4')
  churchId?: string
}
