import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class SendSmsDto {
  @IsString()
  userId: string;

  @IsString()
  to: string;

  @IsString()
  message: string;

  @IsIn(['AUTH', 'ACCOUNT', 'PAYMENT', 'SYSTEM', 'MARKETING'])
  category: 'AUTH' | 'ACCOUNT' | 'PAYMENT' | 'SYSTEM' | 'MARKETING';

  @IsString()
  purpose: string;

  @IsOptional()
  @IsBoolean()
  showInApp?: boolean;

  @IsOptional()
  @IsString()
  customReference?: string;
}
