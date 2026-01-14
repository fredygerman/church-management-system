import { Injectable, Logger, BadRequestException, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { notifications, type NewNotification } from '../database/schema';
import {
  NotificationCategory,
  NotificationStatus,
  NotificationType,
} from '../../../../packages/config/src/types/notifications';
import config from '../config';
import { eq, and } from 'drizzle-orm';
import { Database } from '../database/interfaces/database.interfaces';

export interface SmsResponse {
  success: boolean;
  reference: string;
  notificationId?: number;
  message?: string;
  error?: string;
  response?: any;
}

export interface SendSmsOptions {
  userId: string;
  to: string;
  message: string;
  category: 'AUTH' | 'ACCOUNT' | 'PAYMENT' | 'SYSTEM' | 'MARKETING';
  purpose: string;
  showInApp?: boolean;
  subject?: string;
  metadata?: Record<string, any>;
  customReference?: string;
}

@Injectable()
export class SmsService implements OnModuleInit {
  private readonly logger = new Logger(SmsService.name);
  private readonly smsApiUrl: string;
  private readonly smsUsername: string;
  private readonly smsPassword: string;
  private readonly smsSenderId: string;
  private db: Database;

  constructor(private readonly databaseService: DatabaseService) {
    this.smsApiUrl = config.sms.apiUrl;
    this.smsUsername = config.sms.username;
    this.smsPassword = config.sms.password;
    this.smsSenderId = config.sms.senderId;

    if (!this.smsApiUrl || !this.smsUsername || !this.smsPassword) {
      this.logger.warn('SMS service not configured properly');
    }
  }

  async onModuleInit() {
    this.db = await this.databaseService.getDatabase();
  }

  /**
   * Generate a unique reference ID for SMS tracking
   */
  private generateReference(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `SMS-${timestamp}-${random}`;
  }

  /**
   * Create Basic Auth token
   */
  private getAuthToken(): string {
    const credentials = `${this.smsUsername}:${this.smsPassword}`;
    return Buffer.from(credentials).toString('base64');
  }

  /**
   * Generate preview from message (first 200 characters)
   */
  private generatePreview(message: string): string {
    return message.length > 200 ? message.substring(0, 197) + '...' : message;
  }

  /**
   * Send SMS via the messaging service API with full notification tracking
   */
  async sendSms(options: SendSmsOptions): Promise<SmsResponse> {
    const {
      userId,
      to,
      message,
      category,
      purpose,
      showInApp = false,
      subject,
      metadata,
      customReference,
    } = options;

    const reference = customReference || this.generateReference();
    const preview = this.generatePreview(message);

    // Validate category
    if (!NotificationCategory[category]) {
      throw new BadRequestException(
        `Invalid notification category: ${category}`
      );
    }

    // Create notification record
    const notification: NewNotification = {
      userId,
      type: NotificationType.SMS,
      category: NotificationCategory[category],
      purpose,
      recipient: to,
      sender: this.smsSenderId,
      subject: subject || null,
      message,
      preview,
      showInApp,
      isRead: false,
      reference,
      status: NotificationStatus.PENDING,
    };

    try {
      // Save to database
      const [savedNotification] = await this.db
        .insert(notifications)
        .values(notification)
        .returning();

      this.logger.log(
        `Sending SMS to ${to} with reference ${reference} (userId: ${userId}, purpose: ${purpose})`
      );

      // Prepare API request
      const requestBody = {
        from: this.smsSenderId,
        to,
        text: message,
        reference,
      };

      const response = await fetch(this.smsApiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${this.getAuthToken()}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      this.logger.debug(`SMS API Request: ${JSON.stringify(requestBody)}`);

      const responseData = await response.json();

      if (response.ok) {
        // Update notification as sent
        await this.db
          .update(notifications)
          .set({
            status: NotificationStatus.SENT,
            response: responseData,
            sentAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(notifications.id, savedNotification.id));

        this.logger.log(
          `SMS sent successfully: ${reference} (category: ${category}, purpose: ${purpose})`
        );

        return {
          success: true,
          reference,
          notificationId: savedNotification.id,
          message: 'SMS sent successfully',
          response: responseData,
        };
      } else {
        // Update notification as failed
        await this.db
          .update(notifications)
          .set({
            status: NotificationStatus.FAILED,
            response: responseData,
            error: responseData.message || 'Unknown error',
            updatedAt: new Date(),
          })
          .where(eq(notifications.id, savedNotification.id));

        this.logger.error(
          `SMS sending failed: ${reference}`,
          responseData.message
        );

        return {
          success: false,
          reference,
          notificationId: savedNotification.id,
          error: responseData.message || 'Failed to send SMS',
          response: responseData,
        };
      }
    } catch (error) {
      this.logger.error(`Error sending SMS: ${reference}`, error.stack);

      // Try to update notification status if we have the reference
      try {
        await this.db
          .update(notifications)
          .set({
            status: NotificationStatus.FAILED,
            error: error.message,
            updatedAt: new Date(),
          })
          .where(eq(notifications.reference, reference));
      } catch (dbError) {
        this.logger.error('Failed to update notification status', dbError);
      }

      return {
        success: false,
        reference,
        error: error.message || 'An error occurred while sending SMS',
      };
    }
  }

  /**
   * Get notification by reference
   */
  async getNotificationByReference(reference: string) {
    const [notification] = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.reference, reference))
      .limit(1);

    return notification;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number, userId: string) {
    const [updated] = await this.db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      )
      .returning();

    return updated;
  }
}
