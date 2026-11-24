import { IsOptional, IsString, IsUUID, Length } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class AiChatDto {
  // Declared so the whitelist pipe accepts it; ChurchContextGuard sets the real value.
  @ApiPropertyOptional({ description: 'Injected by ChurchContextGuard' })
  @IsOptional()
  @IsUUID()
  churchId?: string

  @ApiProperty({ description: 'Question for the church assistant', minLength: 1, maxLength: 1000 })
  @IsString()
  @Length(1, 1000)
  message!: string

  @ApiPropertyOptional({ description: 'Continue an existing conversation (owner only)' })
  @IsOptional()
  @IsUUID()
  conversationId?: string
}
