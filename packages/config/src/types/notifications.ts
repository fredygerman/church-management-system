/**
 * Notification types and constants for church management system
 * Includes enums for notification categories, types, statuses, and interfaces for DTO
 */

/**
 * Notification category constants - church management focused
 * Categories help organize and filter notifications by their business domain
 */
export const NotificationCategory = {
  AUTH: 'auth',
  ACCOUNT: 'account',
  PAYMENT: 'payment',
  SYSTEM: 'system',
  MARKETING: 'marketing',
} as const;

/**
 * Notification delivery type constants
 * Determines the channel through which notification is sent
 */
export const NotificationType = {
  SMS: 'sms',
  EMAIL: 'email',
  PUSH: 'push',
} as const;

/**
 * Notification status constants
 * Tracks the lifecycle of a notification
 */
export const NotificationStatus = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
  DELIVERED: 'delivered',
} as const;

/**
 * Common notification purposes - church management scenarios
 * Purpose provides granular classification of why a notification is sent
 */
export const CommonNotificationPurposes = {
  // Account & Authentication
  OTP_VERIFICATION: 'otp_verification',
  PASSWORD_RESET: 'password_reset',
  ACCOUNT_VERIFICATION: 'account_verification',
  ACCOUNT_CREATED: 'account_created',
  ACCOUNT_UPDATED: 'account_updated',
  PROFILE_COMPLETED: 'profile_completed',
  PASSWORD_CHANGED: 'password_changed',

  // Payments & Giving
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  PAYMENT_REMINDER: 'payment_reminder',
  PAYMENT_RECEIVED: 'payment_received',
  DONATION_RECEIVED: 'donation_received',
  GIVING_REMINDER: 'giving_reminder',

  // System & Maintenance
  SYSTEM_MAINTENANCE: 'system_maintenance',
  SYSTEM_UPDATE: 'system_update',
  FEATURE_ANNOUNCEMENT: 'feature_announcement',
  SERVICE_DISRUPTION: 'service_disruption',

  // Church Events & Activities
  EVENT_REMINDER: 'event_reminder',
  SERVICE_ANNOUNCEMENT: 'service_announcement',
  GROUP_INVITATION: 'group_invitation',

  // Marketing & Communications
  PROMO_CAMPAIGN: 'promo_campaign',
  SEASONAL_OFFER: 'seasonal_offer',
  NEWSLETTER: 'newsletter',
  PRAYER_REQUEST: 'prayer_request',
} as const;

/**
 * Type derivations from constant objects
 * These types are extracted from the readonly objects for type safety
 */
export type NotificationCategoryType = typeof NotificationCategory[keyof typeof NotificationCategory];
export type NotificationTypeType = typeof NotificationType[keyof typeof NotificationType];
export type NotificationStatusType = typeof NotificationStatus[keyof typeof NotificationStatus];
export type NotificationPurposeType = string;

/**
 * Metadata for notifications - extensible data structure
 * Allows storing domain-specific context related to a notification
 */
export interface NotificationMetadata {
  paymentId?: number;
  userId?: number;
  eventId?: number;
  groupId?: number;
  deepLink?: string;
  actionUrl?: string;
  [key: string]: any;
}

/**
 * Base notification interface
 * Represents a notification entity with all possible fields
 */
export interface NotificationBase {
  id: number;
  userId: number;
  type: NotificationTypeType;
  category: NotificationCategoryType;
  purpose: NotificationPurposeType;
  recipient: string;
  sender?: string | null;
  subject?: string | null;
  message: string;
  preview?: string | null;
  showInApp: boolean;
  isRead: boolean;
  readAt?: Date | null;
  reference: string;
  status: NotificationStatusType;
  response?: any;
  error?: string | null;
  metadata?: NotificationMetadata | null;
  sentAt?: Date | null;
  deliveredAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for creating a notification
 * Excludes generated fields (id, timestamps)
 */
export interface CreateNotificationDto {
  userId: number;
  type: NotificationTypeType;
  category: NotificationCategoryType;
  purpose: NotificationPurposeType;
  recipient: string;
  sender?: string;
  subject?: string;
  message: string;
  preview?: string;
  showInApp?: boolean;
  reference?: string;
  metadata?: NotificationMetadata;
}

/**
 * DTO for sending SMS notifications
 * Simplified interface for SMS-specific operations
 */
export interface SendSmsDto {
  userId: number;
  to: string;
  message: string;
  category: NotificationCategoryType;
  purpose: NotificationPurposeType;
  showInApp?: boolean;
  metadata?: NotificationMetadata;
}

/**
 * Response structure for SMS sending operations
 */
export interface SmsResponse {
  success: boolean;
  reference: string;
  message?: string;
  error?: string;
  response?: any;
}

/**
 * Filter options for querying notifications
 * Supports filtering and pagination
 */
export interface NotificationFilterOptions {
  userId?: number;
  type?: NotificationTypeType;
  category?: NotificationCategoryType;
  purpose?: string;
  status?: NotificationStatusType;
  showInApp?: boolean;
  isRead?: boolean;
  limit?: number;
  offset?: number;
}
