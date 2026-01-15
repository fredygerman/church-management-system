import { IsEmail, IsString } from 'class-validator';

export class SendWelcomeEmailDto {
  @IsEmail()
  to: string;

  @IsString()
  name: string;
}
