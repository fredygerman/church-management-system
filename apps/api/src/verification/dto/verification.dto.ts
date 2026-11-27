import { IsEmail, IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { VerificationPurpose } from '../verification.types';

export class StartEmailVerificationDto {
  @ApiProperty({ description: 'New email address; the code is sent here' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ enum: ['signup', 'change'] })
  @IsIn(['signup', 'change'])
  purpose!: VerificationPurpose;

  @ApiPropertyOptional({ description: 'Required for password accounts when purpose is change' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  currentPassword?: string;
}

export class StartPhoneVerificationDto {
  @ApiProperty({ description: 'Tanzanian mobile number, for example 0712345678' })
  @IsString()
  @MaxLength(32)
  phone!: string;
}

export class ConfirmCodeDto {
  @ApiProperty({ example: '123456' })
  @Matches(/^\d{6}$/)
  code!: string;
}
