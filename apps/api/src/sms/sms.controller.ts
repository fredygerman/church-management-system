import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SmsService } from './sms.service';
import { SendSmsDto } from '../../../../packages/config/src/dtos/sms';
import {
  NotificationType,
  NotificationStatus,
} from '../../../../packages/config/src/schema/notifications.schema';

@ApiTags('SMS')
@Controller('sms')
export class SmsController {
  private readonly logger = new Logger(SmsController.name);

  constructor(private readonly smsService: SmsService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send SMS (no authentication required for testing)',
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
      return {
        success: false,
        message: 'Notification not found',
      };
    }

    return {
      success: true,
      data: notification,
    };
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get all notifications with pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Notifications retrieved' })
  async getAllNotifications(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    const notifications = await this.smsService.getAllNotifications(
      limit || 50,
      offset || 0
    );

    return {
      success: true,
      data: notifications,
      count: notifications.length,
    };
  }

  @Get('notifications/type/:type')
  @ApiOperation({ summary: 'Get notifications by type' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Notifications retrieved' })
  async getNotificationsByType(
    @Param('type') type: keyof typeof NotificationType,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    const notifications = await this.smsService.getNotificationsByType(
      type,
      limit || 50,
      offset || 0
    );

    return {
      success: true,
      data: notifications,
      count: notifications.length,
    };
  }

  @Get('notifications/status/:status')
  @ApiOperation({ summary: 'Get notifications by status' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Notifications retrieved' })
  async getNotificationsByStatus(
    @Param('status') status: keyof typeof NotificationStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    const notifications = await this.smsService.getNotificationsByStatus(
      status,
      limit || 50,
      offset || 0
    );

    return {
      success: true,
      data: notifications,
      count: notifications.length,
    };
  }
}
