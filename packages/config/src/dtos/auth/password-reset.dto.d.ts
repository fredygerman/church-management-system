export declare class RequestPasswordResetDto {
    email?: string;
    phone?: string;
}
export declare class ResetPasswordDto {
    email?: string;
    phone?: string;
    code: string;
    newPassword: string;
}
export interface PasswordResetResponseDto {
    message: string;
}
