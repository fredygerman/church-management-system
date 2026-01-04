export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    role?: string;
    status?: string;
    isActive?: boolean;
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  };
}
