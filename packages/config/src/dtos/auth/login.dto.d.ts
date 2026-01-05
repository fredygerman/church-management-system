export declare class LoginDto {
    email?: string;
    phone?: string;
    password: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
export interface AuthTokensDto {
    accessToken: string;
    refreshToken: string;
}
export interface AuthResponseDto {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone?: string | null;
        isActive: boolean;
        createdAt: Date | string;
        updatedAt: Date | string;
    };
}
