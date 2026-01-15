import { IsEmail, IsString } from 'class-validator';

export class SendOrderConfirmationDto {
  @IsEmail()
  to: string;

  @IsString()
  name: string;

  @IsString()
  trackingNumber: string;
}
