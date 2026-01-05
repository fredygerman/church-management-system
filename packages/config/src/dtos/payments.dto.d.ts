export declare class CreatePaymentDto {
    userId: string;
    amount: number;
}
export declare class ManualPaymentDto {
    buyer_email: string;
    buyer_name: string;
    buyer_phone: string;
    amount: number;
    userId?: string;
}
export declare class InitiatePaymentDto {
    order_id: string;
    buyer_email: string;
    buyer_name: string;
    buyer_phone: string;
    amount: number;
    webhook_url?: string;
}
export declare class PaymentResponseDto {
    status: string;
    resultcode: string;
    message: string;
    order_id: string;
}
export declare class OrderStatusDto {
    reference: string;
    resultcode: string;
    result: string;
    message: string;
    data: Array<{
        order_id: string;
        creation_date: string;
        amount: string;
        payment_status: string;
        transid: string;
        channel: string;
        reference: string;
        msisdn: string;
    }>;
}
export declare class WebhookPayloadDto {
    order_id: string;
    payment_status: string;
    reference: string;
    metadata?: Record<string, any>;
}
export declare class ErrorResponseDto {
    status: string;
    message: string;
}
