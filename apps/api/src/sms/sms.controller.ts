import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';

import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SmsService } from './sms.service';
import { SendSmsDto } from './dtos/send-sms.dto';
import { JwtAuthGuard, RoleGuard } from '../auth/guards';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/types/permission.types';
import { maskPhone } from '../common/utils/mask-phone';

@ApiTags('SMS')
@Controller('sms')
@UseGuards(JwtAuthGuard)
@RequirePermission('manage:sms')
export class SmsController {
  private readonly logger = new Logger(SmsController.name);

  constructor(private readonly smsService: SmsService) {}

  // Direct sends reach arbitrary numbers on global credentials: platform admin / SUPER_ADMIN only (D-18).
  @Post('send')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Send SMS notification (platform admin only)',
  })
  @ApiResponse({ status: 200, description: 'SMS sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Platform admin only' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async sendSms(@Body() sendSmsDto: SendSmsDto) {
    this.logger.log(`Sending SMS to ${maskPhone(sendSmsDto.to)}`);

    const result = await this.smsService.sendSms(sendSmsDto);

    if (!result.success) {
      return {
        success: false,
        message: result.error,
        reference: result.reference,
        data: result.response,
      };
    }

    return {
      success: true,
      message: 'SMS sent successfully',
      reference: result.reference,
      data: result.response,
    };
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Send a test SMS to a phone number (platform admin only, non-production)' })
  @ApiResponse({ status: 200, description: 'Test SMS sent successfully' })
  @ApiResponse({ status: 403, description: 'Platform admin only' })
  @ApiResponse({ status: 404, description: 'Not available in production' })
  async sendTestSms(@Body() body: { phoneNumber: string; userId: string }) {
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }

    const { phoneNumber, userId } = body;

    this.logger.log(`Sending test SMS to ${maskPhone(phoneNumber)}`);

    const testMessage = `Hello from Church! This is a test SMS sent at ${new Date().toLocaleString()}`;

    const result = await this.smsService.sendSms({
      userId: userId,
      to: phoneNumber,
      message: testMessage,
      category: 'SYSTEM',
      purpose: 'test_sms',
      showInApp: false,
      customReference: `TEST-${Date.now()}`,
    });

    return {
      success: result.success,
      message: result.success
        ? 'Test SMS sent successfully'
        : 'Failed to send test SMS',
      reference: result.reference,
      error: result.error,
      data: result.response,
    };
  }
}
