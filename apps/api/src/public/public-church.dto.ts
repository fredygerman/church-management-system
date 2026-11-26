import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'

export class PublicChurchQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number

  @IsOptional()
  @IsString()
  @MaxLength(120)
  query?: string
}
