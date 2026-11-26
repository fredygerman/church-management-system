import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator'

export const RESOURCE_TYPES = ['document', 'book', 'sermon', 'audio', 'video'] as const
export const RESOURCE_LANGUAGES = ['en', 'sw'] as const

export class LibraryResourceQueryDto {
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
  @IsString()
  @MaxLength(120)
  query?: string

  @IsOptional()
  @IsIn(RESOURCE_TYPES)
  resourceType?: (typeof RESOURCE_TYPES)[number]

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string

  @IsOptional()
  @IsUUID('4')
  branchId?: string
}

export class UpdateLibraryResourceDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string | null

  @IsOptional()
  @IsIn(RESOURCE_TYPES)
  resourceType?: (typeof RESOURCE_TYPES)[number]

  @IsOptional()
  @IsIn(RESOURCE_LANGUAGES)
  language?: (typeof RESOURCE_LANGUAGES)[number] | null

  @IsOptional()
  @IsString()
  @MaxLength(255)
  authorSpeaker?: string | null

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  categories?: string[]

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2147483647)
  durationSeconds?: number | null

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2147483647)
  pageCount?: number | null

  @IsOptional()
  @IsIn(['branch', 'network'])
  scope?: 'branch' | 'network'
}

export class TransitionLibraryResourceDto {
  @IsIn(['draft', 'review', 'published', 'archived'])
  status!: 'draft' | 'review' | 'published' | 'archived'
}

export class ResourceProgressDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2147483647)
  positionSeconds?: number

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  pageNumber?: number | null
}
