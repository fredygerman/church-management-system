import { IsEmail, IsString, IsUrl } from 'class-validator';

export class SendPasswordResetEmailDto {
  @IsEmail()
  to: string;

  @IsString()
  name: string;

  @IsUrl()
  resetUrl: string;
}
