import { IsOptional, IsUUID } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

import type { AttendanceCheckinInput } from '@church/config'

export class CheckinDto implements AttendanceCheckinInput {
  @ApiProperty({ description: 'Member to check into the open service session' })
  @IsUUID('4')
  memberId!: string

  // ChurchContextGuard injects the active tenant before ValidationPipe runs.
  @ApiPropertyOptional({ description: 'Injected by ChurchContextGuard' })
  @IsOptional()
  @IsUUID('4')
  churchId?: string
}
