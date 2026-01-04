import { IsString, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOrderConfirmationDto {
  @ApiProperty({
    description: 'Recipient email address',
    example: 'customer@example.com',
  })
  @IsEmail()
  to!: string;

  @ApiProperty({
    description: 'Customer name',
    example: 'Jane Doe',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Order tracking number',
    example: 'TRK123456789',
  })
  @IsString()
  trackingNumber!: string;
}
