import { IsEmail, IsString, IsNotEmpty, MaxLength, ValidateIf } from 'class-validator';

/**
 * Whitelisted church fields a church admin may change (RM-013).
 * Never accepts id, networkId, deletedAt or timestamps (mass assignment).
 * Fields are optional, but a present field must be valid (null is rejected).
 */
export class UpdateChurchDto {
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  location?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  leadPastorName?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  description?: string;
}
