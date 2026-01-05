export declare class RegisterDto {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    password: string;
}
export declare class VerifyOtpDto {
    code: string;
    email?: string;
    phone?: string;
}
export interface RegisterResponseDto {
    message: string;
    userId: string;
    requiresVerification: boolean;
}
