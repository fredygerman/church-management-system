"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonNotificationPurposes = exports.NotificationStatus = exports.NotificationType = exports.NotificationCategory = void 0;
exports.NotificationCategory = {
    AUTH: 'auth',
    ACCOUNT: 'account',
    ORDER: 'order',
    SHIPMENT: 'shipment',
    PAYMENT: 'payment',
    SYSTEM: 'system',
    MARKETING: 'marketing',
};
exports.NotificationType = {
    SMS: 'sms',
    EMAIL: 'email',
    PUSH: 'push',
};
exports.NotificationStatus = {
    PENDING: 'pending',
    SENT: 'sent',
    FAILED: 'failed',
    DELIVERED: 'delivered',
};
exports.CommonNotificationPurposes = {
    OTP_VERIFICATION: 'otp_verification',
    PASSWORD_RESET: 'password_reset',
    ACCOUNT_VERIFICATION: 'account_verification',
    ACCOUNT_CREATED: 'account_created',
    ACCOUNT_UPDATED: 'account_updated',
    PROFILE_COMPLETED: 'profile_completed',
    PASSWORD_CHANGED: 'password_changed',
    ORDER_CONFIRMED: 'order_confirmed',
    ORDER_PROCESSING: 'order_processing',
    ORDER_SHIPPED: 'order_shipped',
    ORDER_DELIVERED: 'order_delivered',
    ORDER_CANCELLED: 'order_cancelled',
    ORDER_REFUNDED: 'order_refunded',
    PAYMENT_SUCCESS: 'payment_success',
    PAYMENT_FAILED: 'payment_failed',
    PAYMENT_REMINDER: 'payment_reminder',
    PAYMENT_RECEIVED: 'payment_received',
    SHIPMENT_CREATED: 'shipment_created',
    SHIPMENT_PICKED_UP: 'shipment_picked_up',
    SHIPMENT_IN_TRANSIT: 'shipment_in_transit',
    SHIPMENT_OUT_FOR_DELIVERY: 'shipment_out_for_delivery',
    SHIPMENT_DELIVERED: 'shipment_delivered',
    SHIPMENT_DELAYED: 'shipment_delayed',
    SHIPMENT_EXCEPTION: 'shipment_exception',
    SYSTEM_MAINTENANCE: 'system_maintenance',
    SYSTEM_UPDATE: 'system_update',
    FEATURE_ANNOUNCEMENT: 'feature_announcement',
    SERVICE_DISRUPTION: 'service_disruption',
    PROMO_CAMPAIGN: 'promo_campaign',
    SEASONAL_OFFER: 'seasonal_offer',
    NEWSLETTER: 'newsletter',
    PRODUCT_UPDATE: 'product_update',
};
//# sourceMappingURL=notifications.js.map