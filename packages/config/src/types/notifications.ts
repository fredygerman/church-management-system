/**
 * Shared notification types and constants
 * Can be used across API and Web applications
 */

// Notification Categories (stable enum values)
export const NotificationCategory = {
  AUTH: 'auth' as const,
  ACCOUNT: 'account' as const,
  ORDER: 'order' as const,
  SHIPMENT: 'shipment' as const,
  PAYMENT: 'payment' as const,
  SYSTEM: 'system' as const,
  MARKETING: 'marketing' as const,
} as const;

// Notification Types (delivery channels)
export const NotificationType = {
  SMS: 'sms' as const,
  EMAIL: 'email' as const,
  PUSH: 'push' as const,
} as const;

// Notification Status
export const NotificationStatus = {
  PENDING: 'pending' as const,
  SENT: 'sent' as const,
  FAILED: 'failed' as const,
  DELIVERED: 'delivered' as const,
} as const;

// Common notification purposes (can be any string, these are just helpers)
export const CommonNotificationPurposes = {
  // Auth
  OTP_VERIFICATION: 'otp_verification',
  PASSWORD_RESET: 'password_reset',
  ACCOUNT_VERIFICATION: 'account_verification',

  // Account
  ACCOUNT_CREATED: 'account_created',
  ACCOUNT_UPDATED: 'account_updated',
  PROFILE_COMPLETED: 'profile_completed',
  PASSWORD_CHANGED: 'password_changed',

  // Orders
  ORDER_CONFIRMED: 'order_confirmed',
  ORDER_PROCESSING: 'order_processing',
  ORDER_SHIPPED: 'order_shipped',
  ORDER_DELIVERED: 'order_delivered',
  ORDER_CANCELLED: 'order_cancelled',
  ORDER_REFUNDED: 'order_refunded',

  // Payments
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  PAYMENT_REMINDER: 'payment_reminder',
  PAYMENT_RECEIVED: 'payment_received',

  // Shipments
  SHIPMENT_CREATED: 'shipment_created',
  SHIPMENT_PICKED_UP: 'shipment_picked_up',
  SHIPMENT_IN_TRANSIT: 'shipment_in_transit',
  SHIPMENT_OUT_FOR_DELIVERY: 'shipment_out_for_delivery',
  SHIPMENT_DELIVERED: 'shipment_delivered',
  SHIPMENT_DELAYED: 'shipment_delayed',
  SHIPMENT_EXCEPTION: 'shipment_exception',

  // System
  SYSTEM_MAINTENANCE: 'system_maintenance',
  SYSTEM_UPDATE: 'system_update',
  FEATURE_ANNOUNCEMENT: 'feature_announcement',
  SERVICE_DISRUPTION: 'service_disruption',

  // Marketing
  PROMO_CAMPAIGN: 'promo_campaign',
  SEASONAL_OFFER: 'seasonal_offer',
  NEWSLETTER: 'newsletter',
  PRODUCT_UPDATE: 'product_update',
} as const;

// Type exports
export type NotificationCategoryType =
  (typeof NotificationCategory)[keyof typeof NotificationCategory];
export type NotificationTypeType =
  (typeof NotificationType)[keyof typeof NotificationType];
export type NotificationStatusType =
  (typeof NotificationStatus)[keyof typeof NotificationStatus];
export type NotificationPurposeType = string; // Flexible - can be any string

// Notification metadata type
export interface NotificationMetadata {
  orderId?: number;
  shipmentId?: number;
  paymentId?: number;
  userId?: number;
  deepLink?: string; // e.g., '/orders/123', '/shipments/456'
  actionUrl?: string; // External URL if needed
  [key: string]: any;
}

// Base notification interface (for frontend/API communication)
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

// DTO for creating notifications
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

// DTO for sending SMS
export interface SendSmsDto {
  userId: number;
  to: string;
  message: string;
  category: NotificationCategoryType;
  purpose: NotificationPurposeType;
  showInApp?: boolean;
  metadata?: NotificationMetadata;
}

// SMS Response interface
export interface SmsResponse {
  success: boolean;
  reference: string;
  message?: string;
  error?: string;
  response?: any;
}

// Notification filter options
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
