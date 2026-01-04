import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  payments,
  paymentWebhooks,
} from '../../../../packages/config/src/schema/payments.schema';
import { users } from '../../../../packages/config/src/schema/users.schema';
import { eq } from 'drizzle-orm';
import config from '../config';
import {
  CreatePaymentDto,
  ManualPaymentDto,
  InitiatePaymentDto,
  PaymentResponseDto,
  OrderStatusDto,
  WebhookPayloadDto,
} from '../../../../packages/config/src/dtos/payments.dto';
import { randomUUID } from 'crypto';

// Payment types
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type NewPaymentWebhook = typeof paymentWebhooks.$inferInsert;

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly zenoApiKey: string | undefined;
  private readonly zenoBaseUrl: string;
  private readonly isConfigured: boolean;

  constructor(private readonly databaseService: DatabaseService) {
    this.zenoApiKey = config.payment.zeno.apiKey;
    this.zenoBaseUrl = config.payment.zeno.baseUrl;
    this.isConfigured = !!this.zenoApiKey;

    if (!this.isConfigured) {
      this.logger.warn(
        '⚠️  ZenoPay is not configured - payment features will be unavailable. Set ZENO_API_KEY to enable payments.'
      );
    } else {
      this.logger.log('✅ ZenoPay payment service initialized successfully');
    }
  }

  /**
   * Check if payment service is configured and ready
   */
  private ensureConfigured(): void {
    if (!this.isConfigured) {
      throw new HttpException(
        'Payment service is not configured. Please contact administrator.',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  /**
   * Create payment for a user (simplified - fetches user details automatically)
   */
  async createUserPayment(dto: CreatePaymentDto): Promise<PaymentResponseDto> {
    this.ensureConfigured();
    this.logger.log(`Creating payment for user: ${dto.userId}`);

    try {
      const db = this.databaseService.getDb();

      // Fetch user details
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, dto.userId))
        .limit(1);

      if (userResult.length === 0) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const user = userResult[0];

      // Validate user has required fields
      if (!user.email || !user.firstName || !user.lastName) {
        throw new HttpException(
          'User profile is incomplete. Email and name are required.',
          HttpStatus.BAD_REQUEST
        );
      }

      if (!user.phone) {
        throw new HttpException(
          'User phone number is required for payments',
          HttpStatus.BAD_REQUEST
        );
      }

      // Validate phone number format
      const phoneRegex = /^07\d{8}$/;
      if (!phoneRegex.test(user.phone)) {
        throw new HttpException(
          'User phone number must be a valid Tanzanian mobile number (07XXXXXXXX)',
          HttpStatus.BAD_REQUEST
        );
      }

      // Generate UUID for the order
      const orderId = randomUUID();

      // Create InitiatePaymentDto from user data
      const paymentDto: InitiatePaymentDto = {
        order_id: orderId,
        buyer_email: user.email,
        buyer_name: `${user.firstName} ${user.lastName}`,
        buyer_phone: user.phone,
        amount: dto.amount,
      };

      this.logger.log(
        `Initiating payment for user ${user.email} - Order: ${orderId}`
      );

      // Call the internal initiate payment method with userId
      return await this.initiatePaymentInternal(paymentDto, dto.userId);
    } catch (error) {
      this.logger.error(
        `Error creating payment for user ${dto.userId}:`,
        error
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Internal server error during payment creation',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Manual/test payment - bypasses user lookup (for testing purposes)
   */
  async createManualPayment(
    dto: ManualPaymentDto
  ): Promise<PaymentResponseDto> {
    this.ensureConfigured();
    this.logger.log('Creating manual/test payment');

    // Generate UUID for the order
    const orderId = randomUUID();

    // Create InitiatePaymentDto
    const paymentDto: InitiatePaymentDto = {
      order_id: orderId,
      buyer_email: dto.buyer_email,
      buyer_name: dto.buyer_name,
      buyer_phone: dto.buyer_phone,
      amount: dto.amount,
    };

    this.logger.log(`Generated order ID: ${orderId}`);
    this.logger.log(`Using webhook URL: ${config.payment.zeno.webhookUrl}`);

    // Call the internal initiate payment method with optional userId
    return await this.initiatePaymentInternal(paymentDto, dto.userId);
  }

  /**
   * Internal method to initiate payment with ZenoPay API
   */
  private async initiatePaymentInternal(
    dto: InitiatePaymentDto,
    userId?: string
  ): Promise<PaymentResponseDto> {
    this.ensureConfigured();
    this.logger.log(`Initiating payment for order: ${dto.order_id}`);

    try {
      // Check if order already exists
      const db = this.databaseService.getDb();
      const existingPayment = await db
        .select()
        .from(payments)
        .where(eq(payments.orderId, dto.order_id))
        .limit(1);

      if (existingPayment.length > 0) {
        throw new HttpException(
          'Order ID already exists',
          HttpStatus.BAD_REQUEST
        );
      }

      // Create payment record in database
      // Always use webhook URL from environment configuration
      const webhookUrl = config.payment.zeno.webhookUrl || dto.webhook_url;

      const newPayment: NewPayment = {
        userId: userId || null, // Allow null for test payments without user
        orderId: dto.order_id,
        buyerEmail: dto.buyer_email,
        buyerName: dto.buyer_name,
        buyerPhone: dto.buyer_phone,
        amount: dto.amount,
        paymentStatus: 'PENDING',
        webhookUrl: webhookUrl,
      };

      await db.insert(payments).values(newPayment);

      // Prepare request payload with webhook URL from config
      const paymentPayload = {
        ...dto,
        webhook_url: webhookUrl,
      };

      // Make API call to ZenoPay
      const response = await fetch(
        `${this.zenoBaseUrl}/payments/mobile_money_tanzania`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.zenoApiKey,
          },
          body: JSON.stringify(paymentPayload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        this.logger.error(`ZenoPay API error: ${response.status}`, errorData);

        // Update payment status to failed
        await db
          .update(payments)
          .set({ paymentStatus: 'FAILED', updatedAt: new Date() })
          .where(eq(payments.orderId, dto.order_id));

        throw new HttpException(
          errorData.message || 'Payment initiation failed',
          response.status
        );
      }

      const responseData: PaymentResponseDto = await response.json();
      this.logger.log(
        `Payment initiated successfully for order: ${dto.order_id}`
      );

      return responseData;
    } catch (error) {
      this.logger.error(
        `Error initiating payment for order ${dto.order_id}:`,
        error
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Internal server error during payment initiation',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Test payment initiation - auto-generates UUID and uses env webhook
   * This is an alias for createManualPayment for backwards compatibility
   */
  async testPayment(dto: ManualPaymentDto): Promise<PaymentResponseDto> {
    this.logger.log('Initiating test payment with auto-generated UUID');
    return await this.createManualPayment(dto);
  }

  /**
   * Check order status from ZenoPay API
   */
  async checkOrderStatus(orderId: string): Promise<OrderStatusDto> {
    this.ensureConfigured();
    this.logger.log(`Checking status for order: ${orderId}`);

    try {
      const response = await fetch(
        `${this.zenoBaseUrl}/payments/order-status?order_id=${orderId}`,
        {
          method: 'GET',
          headers: {
            'x-api-key': this.zenoApiKey,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        this.logger.error(`ZenoPay API error: ${response.status}`, errorData);
        throw new HttpException(
          errorData.message || 'Failed to fetch order status',
          response.status
        );
      }

      const statusData: OrderStatusDto = await response.json();

      // Update local database with latest status if available
      if (statusData.data && statusData.data.length > 0) {
        const orderData = statusData.data[0];
        await this.updatePaymentFromApiResponse(orderData);
      }

      return statusData;
    } catch (error) {
      this.logger.error(`Error checking status for order ${orderId}:`, error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Internal server error while checking order status',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Process webhook notification from ZenoPay
   */
  async processWebhook(payload: WebhookPayloadDto): Promise<void> {
    this.logger.log(`Processing webhook for order: ${payload.order_id}`);

    try {
      const db = this.databaseService.getDb();

      // Log the webhook event
      const webhookRecord: NewPaymentWebhook = {
        orderId: payload.order_id,
        paymentStatus: payload.payment_status,
        reference: payload.reference,
        metadata: JSON.stringify(payload.metadata || {}),
      };

      await db.insert(paymentWebhooks).values(webhookRecord);

      // Update payment status
      const updateResult = await db
        .update(payments)
        .set({
          paymentStatus: payload.payment_status as any,
          reference: payload.reference,
          updatedAt: new Date(),
        })
        .where(eq(payments.orderId, payload.order_id));

      this.logger.log(
        `Webhook processed successfully for order: ${payload.order_id}`
      );
    } catch (error) {
      this.logger.error(
        `Error processing webhook for order ${payload.order_id}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get payment by order ID from local database
   */
  async getPaymentByOrderId(orderId: string): Promise<Payment | null> {
    try {
      const db = this.databaseService.getDb();
      const result = await db
        .select()
        .from(payments)
        .where(eq(payments.orderId, orderId))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      this.logger.error(`Error fetching payment for order ${orderId}:`, error);
      throw new HttpException(
        'Error fetching payment data',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Update payment record from API response data
   */
  private async updatePaymentFromApiResponse(orderData: any): Promise<void> {
    try {
      const db = this.databaseService.getDb();
      await db
        .update(payments)
        .set({
          paymentStatus: orderData.payment_status,
          channel: orderData.channel,
          transactionId: orderData.transid,
          reference: orderData.reference,
          msisdn: orderData.msisdn,
          updatedAt: new Date(),
        })
        .where(eq(payments.orderId, orderData.order_id));

      this.logger.log(
        `Updated payment record for order: ${orderData.order_id}`
      );
    } catch (error) {
      this.logger.error(
        `Error updating payment record for order ${orderData.order_id}:`,
        error
      );
    }
  }

  /**
   * Get all payments with optional filtering
   */
  async getAllPayments(
    limit: number = 50,
    offset: number = 0
  ): Promise<Payment[]> {
    try {
      const db = this.databaseService.getDb();
      const result = await db
        .select()
        .from(payments)
        .limit(limit)
        .offset(offset);

      return result;
    } catch (error) {
      this.logger.error('Error fetching payments:', error);
      throw new HttpException(
        'Error fetching payments',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get service status and configuration info
   */
  getServiceStatus(): {
    isConfigured: boolean;
    provider: string;
    message: string;
  } {
    return {
      isConfigured: this.isConfigured,
      provider: 'ZenoPay',
      message: this.isConfigured
        ? 'Payment service is configured and ready'
        : 'Payment service is not configured - ZENO_API_KEY is missing',
    };
  }

  /**
   * Sync all pending payments - checks status and updates database
   * Also marks transactions as FAILED if they've been pending for more than 5 minutes
   */
  async syncPendingPayments(): Promise<{
    total: number;
    updated: number;
    failed: number;
    expired: number;
    errors: string[];
  }> {
    this.ensureConfigured();
    this.logger.log('Starting sync of pending payments');

    try {
      const db = this.databaseService.getDb();

      // Get all pending payments
      const pendingPayments = await db
        .select()
        .from(payments)
        .where(eq(payments.paymentStatus, 'PENDING'));

      this.logger.log(
        `Found ${pendingPayments.length} pending payments to sync`
      );

      let updated = 0;
      let failed = 0;
      let expired = 0;
      const errors: string[] = [];
      const now = new Date();
      const EXPIRY_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

      // Check status for each pending payment
      for (const payment of pendingPayments) {
        try {
          // Check if payment has been pending for more than 5 minutes
          const createdAt = new Date(payment.createdAt);
          const pendingDuration = now.getTime() - createdAt.getTime();

          if (pendingDuration > EXPIRY_THRESHOLD_MS) {
            // Mark as FAILED if expired
            await db
              .update(payments)
              .set({
                paymentStatus: 'FAILED',
                updatedAt: new Date(),
              })
              .where(eq(payments.orderId, payment.orderId));

            expired++;
            this.logger.warn(
              `Marked payment ${payment.orderId} as FAILED (pending for ${Math.round(pendingDuration / 1000 / 60)} minutes)`
            );
            continue;
          }

          // Check status from API for non-expired payments
          this.logger.log(`Checking status for order: ${payment.orderId}`);

          const statusData = await this.checkOrderStatus(payment.orderId);

          if (statusData.data && statusData.data.length > 0) {
            const orderData = statusData.data[0];

            // Only count as updated if status actually changed
            if (orderData.payment_status !== 'PENDING') {
              updated++;
              this.logger.log(
                `Updated payment ${payment.orderId}: ${orderData.payment_status}`
              );
            }
          }
        } catch (error) {
          failed++;
          const errorMsg = `Failed to sync ${payment.orderId}: ${error.message}`;
          errors.push(errorMsg);
          this.logger.error(errorMsg);
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const result = {
        total: pendingPayments.length,
        updated,
        failed,
        expired,
        errors,
      };

      this.logger.log(
        `Sync completed: ${updated} updated, ${expired} expired, ${failed} failed out of ${pendingPayments.length} total`
      );

      return result;
    } catch (error) {
      this.logger.error('Error syncing pending payments:', error);
      throw new HttpException(
        'Failed to sync pending payments',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
