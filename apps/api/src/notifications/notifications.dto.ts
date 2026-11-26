import { Transform } from 'class-transformer'
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator'

export class NotificationListQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  cursor?: number

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  unread?: boolean
}
