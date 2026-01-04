import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  notifications,
  type NewNotification,
  NotificationCategory,
  NotificationStatus,
  NotificationType,
} from '../../../../packages/config/src/schema/notifications.schema';
import config from '../config';
import { eq, and, desc } from 'drizzle-orm';

export interface SmsResponse {
  success: boolean;
  reference: string;
  notificationId?: string; // Changed from number to string (UUID)
  message?: string;
  error?: string;
  response?: any;
}

export interface SendSmsOptions {
  userId: string; // Changed from number to string (UUID)
  to: string;
  message: string;
  category: keyof typeof NotificationCategory;
  purpose: string;
  showInApp?: boolean;
  subject?: string;
  metadata?: Record<string, any>;
  customReference?: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly smsApiUrl: string;
  private readonly smsUsername: string;
  private readonly smsPassword: string;
  private readonly smsSenderId: string;

  constructor(private readonly db: DatabaseService) {
    this.smsApiUrl = config.sms.apiUrl;
    this.smsUsername = config.sms.username;
    this.smsPassword = config.sms.password;
    this.smsSenderId = config.sms.senderId;

    if (!this.smsApiUrl || !this.smsUsername || !this.smsPassword) {
      this.logger.warn('SMS service not configured properly');
    }
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
      metadata: metadata || null,
    };

    try {
      // Save to database
      const [savedNotification] = await this.db
        .getDb()
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
          .getDb()
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
          .getDb()
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
          .getDb()
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
      .getDb()
      .select()
      .from(notifications)
      .where(eq(notifications.reference, reference))
      .limit(1);

    return notification;
  }

  /**
   * Get notifications by user ID
   */
  async getUserNotifications(
    userId: string, // Changed from number to string (UUID)
    options: {
      category?: keyof typeof NotificationCategory;
      purpose?: string;
      showInApp?: boolean;
      isRead?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const {
      category,
      purpose,
      showInApp,
      isRead,
      limit = 50,
      offset = 0,
    } = options;

    const conditions = [eq(notifications.userId, userId)];

    if (category && NotificationCategory[category]) {
      conditions.push(
        eq(notifications.category, NotificationCategory[category])
      );
    }

    if (purpose) {
      conditions.push(eq(notifications.purpose, purpose));
    }

    if (showInApp !== undefined) {
      conditions.push(eq(notifications.showInApp, showInApp));
    }

    if (isRead !== undefined) {
      conditions.push(eq(notifications.isRead, isRead));
    }

    return this.db
      .getDb()
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(
    userId: string, // Changed from number to string (UUID)
    options: {
      category?: keyof typeof NotificationCategory;
      showInApp?: boolean;
    } = {}
  ) {
    const { category, showInApp = true } = options;

    const conditions = [
      eq(notifications.userId, userId),
      eq(notifications.isRead, false),
      eq(notifications.showInApp, showInApp),
    ];

    if (category && NotificationCategory[category]) {
      conditions.push(
        eq(notifications.category, NotificationCategory[category])
      );
    }

    const result = await this.db
      .getDb()
      .select()
      .from(notifications)
      .where(and(...conditions));

    return result.length;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    // Changed from number to string (UUID)
    const [updated] = await this.db
      .getDb()
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

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(
    userId: string, // Changed from number to string (UUID)
    category?: keyof typeof NotificationCategory
  ) {
    const conditions = [
      eq(notifications.userId, userId),
      eq(notifications.isRead, false),
    ];

    if (category && NotificationCategory[category]) {
      conditions.push(
        eq(notifications.category, NotificationCategory[category])
      );
    }

    const updated = await this.db
      .getDb()
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(...conditions))
      .returning();

    return updated;
  }

  /**
   * Get all notifications with pagination (admin)
   */
  async getAllNotifications(limit = 50, offset = 0) {
    return this.db
      .getDb()
      .select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Get notifications by type
   */
  async getNotificationsByType(
    type: keyof typeof NotificationType,
    limit = 50,
    offset = 0
  ) {
    return this.db
      .getDb()
      .select()
      .from(notifications)
      .where(eq(notifications.type, NotificationType[type]))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Get notifications by status
   */
  async getNotificationsByStatus(
    status: keyof typeof NotificationStatus,
    limit = 50,
    offset = 0
  ) {
    return this.db
      .getDb()
      .select()
      .from(notifications)
      .where(eq(notifications.status, NotificationStatus[status]))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Get notifications by category
   */
  async getNotificationsByCategory(
    category: keyof typeof NotificationCategory,
    limit = 50,
    offset = 0
  ) {
    return this.db
      .getDb()
      .select()
      .from(notifications)
      .where(eq(notifications.category, NotificationCategory[category]))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
  }
}
