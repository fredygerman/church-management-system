export declare const NotificationCategory: {
    readonly AUTH: "auth";
    readonly ACCOUNT: "account";
    readonly ORDER: "order";
    readonly SHIPMENT: "shipment";
    readonly PAYMENT: "payment";
    readonly SYSTEM: "system";
    readonly MARKETING: "marketing";
};
export declare const NotificationType: {
    readonly SMS: "sms";
    readonly EMAIL: "email";
    readonly PUSH: "push";
};
export declare const NotificationStatus: {
    readonly PENDING: "pending";
    readonly SENT: "sent";
    readonly FAILED: "failed";
    readonly DELIVERED: "delivered";
};
export declare const CommonNotificationPurposes: {
    readonly OTP_VERIFICATION: "otp_verification";
    readonly PASSWORD_RESET: "password_reset";
    readonly ACCOUNT_VERIFICATION: "account_verification";
    readonly ACCOUNT_CREATED: "account_created";
    readonly ACCOUNT_UPDATED: "account_updated";
    readonly PROFILE_COMPLETED: "profile_completed";
    readonly PASSWORD_CHANGED: "password_changed";
    readonly ORDER_CONFIRMED: "order_confirmed";
    readonly ORDER_PROCESSING: "order_processing";
    readonly ORDER_SHIPPED: "order_shipped";
    readonly ORDER_DELIVERED: "order_delivered";
    readonly ORDER_CANCELLED: "order_cancelled";
    readonly ORDER_REFUNDED: "order_refunded";
    readonly PAYMENT_SUCCESS: "payment_success";
    readonly PAYMENT_FAILED: "payment_failed";
    readonly PAYMENT_REMINDER: "payment_reminder";
    readonly PAYMENT_RECEIVED: "payment_received";
    readonly SHIPMENT_CREATED: "shipment_created";
    readonly SHIPMENT_PICKED_UP: "shipment_picked_up";
    readonly SHIPMENT_IN_TRANSIT: "shipment_in_transit";
    readonly SHIPMENT_OUT_FOR_DELIVERY: "shipment_out_for_delivery";
    readonly SHIPMENT_DELIVERED: "shipment_delivered";
    readonly SHIPMENT_DELAYED: "shipment_delayed";
    readonly SHIPMENT_EXCEPTION: "shipment_exception";
    readonly SYSTEM_MAINTENANCE: "system_maintenance";
    readonly SYSTEM_UPDATE: "system_update";
    readonly FEATURE_ANNOUNCEMENT: "feature_announcement";
    readonly SERVICE_DISRUPTION: "service_disruption";
    readonly PROMO_CAMPAIGN: "promo_campaign";
    readonly SEASONAL_OFFER: "seasonal_offer";
    readonly NEWSLETTER: "newsletter";
    readonly PRODUCT_UPDATE: "product_update";
};
export type NotificationCategoryType = (typeof NotificationCategory)[keyof typeof NotificationCategory];
export type NotificationTypeType = (typeof NotificationType)[keyof typeof NotificationType];
export type NotificationStatusType = (typeof NotificationStatus)[keyof typeof NotificationStatus];
export type NotificationPurposeType = string;
export interface NotificationMetadata {
    orderId?: number;
    shipmentId?: number;
    paymentId?: number;
    userId?: number;
    deepLink?: string;
    actionUrl?: string;
    [key: string]: any;
}
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
export interface SendSmsDto {
    userId: number;
    to: string;
    message: string;
    category: NotificationCategoryType;
    purpose: NotificationPurposeType;
    showInApp?: boolean;
    metadata?: NotificationMetadata;
}
export interface SmsResponse {
    success: boolean;
    reference: string;
    message?: string;
    error?: string;
    response?: any;
}
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
