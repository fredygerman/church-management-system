import { IsIn, IsOptional, IsString, IsUUID, Length } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class AiFeedbackDto {
  // Declared so the whitelist pipe accepts it; ChurchContextGuard sets the real value.
  @ApiPropertyOptional({ description: 'Injected by ChurchContextGuard' })
  @IsOptional()
  @IsUUID()
  churchId?: string

  @ApiProperty({ description: 'Conversation the answer belongs to (owner only)' })
  @IsUUID()
  conversationId!: string

  @ApiProperty({ description: 'answerId returned with the answer', minLength: 1, maxLength: 64 })
  @IsString()
  @Length(1, 64)
  answerId!: string

  @ApiProperty({ enum: ['helpful', 'not_helpful'] })
  @IsIn(['helpful', 'not_helpful'])
  rating!: 'helpful' | 'not_helpful'
}
