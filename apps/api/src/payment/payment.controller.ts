import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Headers,
  UnauthorizedException,
  Logger,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import {
  CreatePaymentDto,
  ManualPaymentDto,
  PaymentResponseDto,
  OrderStatusDto,
  WebhookPayloadDto,
  ErrorResponseDto,
} from '../../../../packages/config/src/dtos/payments.dto';
import config from '../config';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);
  private readonly zenoApiKey: string;

  constructor(private readonly paymentService: PaymentService) {
    this.zenoApiKey = config.payment.zeno.apiKey;
  }

  @Get('status')
  @ApiOperation({
    summary: 'Get Payment Service Status',
    description: 'Check if the payment service is configured and available',
  })
  @ApiResponse({
    status: 200,
    description: 'Service status retrieved successfully',
  })
  getServiceStatus() {
    return this.paymentService.getServiceStatus();
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test Payment (Manual Entry)',
    description:
      'Test endpoint that auto-generates UUID and allows manual entry of payment details. Perfect for testing without a user account!',
  })
  @ApiResponse({
    status: 200,
    description: 'Test payment initiated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request payload',
  })
  @ApiResponse({
    status: 503,
    description: 'Payment service not configured',
  })
  async testPayment(
    @Body() manualPaymentDto: ManualPaymentDto
  ): Promise<PaymentResponseDto> {
    this.logger.log('Received test payment request');
    return await this.paymentService.testPayment(manualPaymentDto);
  }

  @Post('create')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create Payment for User',
    description:
      'Create a payment for a registered user. User details (name, email, phone) are automatically fetched from the database.',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment initiated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request payload or incomplete user profile',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 503,
    description: 'Payment service not configured',
  })
  async createPayment(
    @Body() createPaymentDto: CreatePaymentDto
  ): Promise<PaymentResponseDto> {
    this.logger.log(
      `Received payment creation request for user: ${createPaymentDto.userId}`
    );
    return await this.paymentService.createUserPayment(createPaymentDto);
  }

  @Post('mobile-money-tanzania')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Initiate Mobile Money Payment (Deprecated)',
    description:
      'DEPRECATED: Use POST /payments/create for user payments or POST /payments/test for manual testing. This endpoint is kept for backwards compatibility.',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment initiated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request payload',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async initiatePayment(
    @Body() manualPaymentDto: ManualPaymentDto
  ): Promise<PaymentResponseDto> {
    this.logger.log(
      'Received payment initiation request (deprecated endpoint)'
    );
    return await this.paymentService.createManualPayment(manualPaymentDto);
  }

  @Get('order-status')
  @ApiOperation({
    summary: 'Check Order Status',
    description: 'Check the current status of a payment order',
  })
  @ApiQuery({
    name: 'order_id',
    required: true,
    description: 'The order_id from the payment initiation response',
    example: '3rer407fe-3ee8-4525-456f-ccb95de38250',
  })
  @ApiResponse({
    status: 200,
    description: 'Order status retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid order ID',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  async checkOrderStatus(
    @Query('order_id') orderId: string
  ): Promise<OrderStatusDto> {
    this.logger.log(`Received order status request for: ${orderId}`);
    return await this.paymentService.checkOrderStatus(orderId);
  }

  @Get('order/:orderId')
  @ApiOperation({
    summary: 'Get Local Payment Record',
    description: 'Get payment information from local database by order ID',
  })
  @ApiParam({
    name: 'orderId',
    required: true,
    description: 'The order ID to look up',
    example: '3rer407fe-3ee8-4525-456f-ccb95de38250',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment record retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Payment not found',
  })
  async getPaymentByOrderId(@Param('orderId') orderId: string) {
    this.logger.log(`Fetching local payment record for order: ${orderId}`);
    const payment = await this.paymentService.getPaymentByOrderId(orderId);

    if (!payment) {
      return {
        status: 'error',
        message: 'Payment not found',
      };
    }

    return {
      status: 'success',
      data: payment,
    };
  }

  @Get('list')
  @ApiOperation({
    summary: 'List All Payments',
    description: 'Get a paginated list of all payments',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of records to return',
    example: 50,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Number of records to skip',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Payments list retrieved successfully',
  })
  async getAllPayments(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    this.logger.log('Fetching payments list');
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    const payments = await this.paymentService.getAllPayments(
      limitNum,
      offsetNum
    );

    return {
      status: 'success',
      data: payments,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        count: payments.length,
      },
    };
  }

  @Post('sync-pending')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sync Pending Payments',
    description:
      'Manually trigger a sync of all pending payments to check their current status from ZenoPay',
  })
  @ApiResponse({
    status: 200,
    description: 'Sync completed successfully',
  })
  @ApiResponse({
    status: 503,
    description: 'Payment service not configured',
  })
  async syncPendingPayments() {
    this.logger.log('Manual sync of pending payments triggered');
    const result = await this.paymentService.syncPendingPayments();

    return {
      status: 'success',
      message: 'Pending payments sync completed',
      ...result,
    };
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'ZenoPay Webhook Endpoint',
    description: 'Receive payment status updates from ZenoPay',
  })
  @ApiHeader({
    name: 'x-api-key',
    description: 'ZenoPay API key for webhook verification',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid API key',
  })
  async processWebhook(
    @Headers('x-api-key') apiKey: string,
    @Body() webhookPayload: WebhookPayloadDto
  ): Promise<{ status: string; message: string }> {
    this.logger.log(`Received webhook for order: ${webhookPayload.order_id}`);

    // Verify the API key
    if (!apiKey || apiKey !== this.zenoApiKey) {
      this.logger.warn(`Invalid API key in webhook request: ${apiKey}`);
      throw new UnauthorizedException('Invalid API Key');
    }

    try {
      await this.paymentService.processWebhook(webhookPayload);

      return {
        status: 'success',
        message: 'Webhook processed successfully',
      };
    } catch (error) {
      this.logger.error('Error processing webhook:', error);
      throw error;
    }
  }
}
