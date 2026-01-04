import type { NotificationMetadata } from '../../types/notifications';
export declare class SendSmsDto {
    userId: number;
    to: string;
    message: string;
    category: 'AUTH' | 'ACCOUNT' | 'ORDER' | 'SHIPMENT' | 'PAYMENT' | 'SYSTEM' | 'MARKETING';
    purpose: string;
    subject?: string;
    showInApp?: boolean;
    metadata?: NotificationMetadata;
    customReference?: string;
}
