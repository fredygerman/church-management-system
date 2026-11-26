import { IsEmail, IsString, IsOptional } from 'class-validator';

/**
 * Direct send body. Plain text only: raw HTML from callers is not accepted (RM-014).
 */
export class SendEmailDto {
  @IsEmail()
  to: string;

  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  text?: string;
}
