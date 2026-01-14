import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SmsService } from './sms.service';
import type { SendSmsDto } from '../../../../packages/config/src/dtos/sms';

@ApiTags('SMS')
@Controller('sms')
export class SmsController {
  private readonly logger = new Logger(SmsController.name);

  constructor(private readonly smsService: SmsService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send SMS notification',
  })
  @ApiResponse({ status: 200, description: 'SMS sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async sendSms(@Body() sendSmsDto: SendSmsDto) {
    this.logger.log(`Sending SMS to ${sendSmsDto.to}`);

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
  @ApiOperation({ summary: 'Send a test SMS to a phone number' })
  @ApiResponse({ status: 200, description: 'Test SMS sent successfully' })
  async sendTestSms(@Body() body: { phoneNumber: string; userId: string }) {
    const { phoneNumber, userId } = body;

    this.logger.log(`Sending test SMS to ${phoneNumber}`);

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

  @Get('notification/:reference')
  @ApiOperation({ summary: 'Get notification details by reference' })
  @ApiResponse({ status: 200, description: 'Notification found' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async getNotification(@Param('reference') reference: string) {
    const notification =
      await this.smsService.getNotificationByReference(reference);

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }
}
