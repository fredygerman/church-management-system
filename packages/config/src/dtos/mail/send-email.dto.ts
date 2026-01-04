import { IsString, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendEmailDto {
  @ApiProperty({
    description: 'Recipient email address(es)',
    example: 'user@example.com',
  })
  @IsEmail()
  to!: string | string[];

  @ApiProperty({
    description: 'Email subject',
    example: 'Welcome to Church',
  })
  @IsString()
  subject!: string;

  @ApiPropertyOptional({
    description: 'HTML content of the email',
    example: '<h1>Welcome!</h1>',
  })
  @IsOptional()
  @IsString()
  html?: string;

  @ApiPropertyOptional({
    description: 'Plain text content of the email',
    example: 'Welcome to our service!',
  })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({
    description: 'Sender email address',
    example: 'noreply@church.org',
  })
  @IsOptional()
  @IsString()
  from?: string;
}
