export declare class ResendOtpDto {
    userId: string;
    email?: string;
    phone?: string;
    purpose: 'REGISTRATION' | 'PASSWORD_RESET';
}
