import { Body, Controller, Post, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { MailService } from './mail.service';
import {
  SendEmailDto,
  SendWelcomeEmailDto,
  SendPasswordResetEmailDto,
  SendOrderConfirmationDto,
} from '../../../../packages/config/src/dtos/mail';

@ApiTags('Mail')
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get email service status' })
  @ApiResponse({
    status: 200,
    description: 'Returns email service configuration status',
    schema: {
      example: {
        success: true,
        message: 'Request successful',
        data: {
          configured: true,
          provider: 'Resend',
        },
      },
    },
  })
  getStatus() {
    return this.mailService.getServiceStatus();
  }

  @Post('send')
  @ApiOperation({ summary: 'Send a custom email' })
  @ApiBody({ type: SendEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Email sent successfully',
    schema: {
      example: {
        success: true,
        message: 'Request successful',
        data: {
          success: true,
          messageId: 'email-id-123',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Email sending failed',
    schema: {
      example: {
        success: false,
        message: 'Email sending failed',
        data: {
          success: false,
          error: 'Invalid email address',
        },
      },
    },
  })
  async sendEmail(@Body() emailDto: SendEmailDto) {
    return this.mailService.sendEmail(emailDto);
  }

  @Post('send-welcome')
  @ApiOperation({ summary: 'Send welcome email to new user' })
  @ApiBody({ type: SendWelcomeEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Welcome email sent successfully',
    schema: {
      example: {
        success: true,
        message: 'Request successful',
        data: {
          success: true,
          messageId: 'welcome-email-id-123',
        },
      },
    },
  })
  async sendWelcomeEmail(@Body() welcomeDto: SendWelcomeEmailDto) {
    return this.mailService.sendWelcomeEmail(welcomeDto.to, welcomeDto.name);
  }

  @Post('send-password-reset')
  @ApiOperation({ summary: 'Send password reset email' })
  @ApiBody({ type: SendPasswordResetEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent successfully',
    schema: {
      example: {
        success: true,
        message: 'Request successful',
        data: {
          success: true,
          messageId: 'reset-email-id-123',
        },
      },
    },
  })
  async sendPasswordResetEmail(@Body() resetDto: SendPasswordResetEmailDto) {
    return this.mailService.sendPasswordResetEmail(
      resetDto.to,
      resetDto.name,
      resetDto.resetUrl
    );
  }

  @Post('send-order-confirmation')
  @ApiOperation({ summary: 'Send order confirmation email' })
  @ApiBody({ type: SendOrderConfirmationDto })
  @ApiResponse({
    status: 200,
    description: 'Order confirmation email sent successfully',
    schema: {
      example: {
        success: true,
        message: 'Request successful',
        data: {
          success: true,
          messageId: 'order-email-id-123',
        },
      },
    },
  })
  async sendOrderConfirmationEmail(@Body() orderDto: SendOrderConfirmationDto) {
    return this.mailService.sendOrderConfirmationEmail(
      orderDto.to,
      orderDto.name,
      orderDto.trackingNumber
    );
  }
}
