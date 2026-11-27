// Shared contracts for contact verification (lane 04, RM-031 / RM-032 / RM-033).
// Kept free of runtime imports so the service can be unit-tested without a database.

export const CODE_TTL_MINUTES = 10;
export const CODE_TTL_MS = CODE_TTL_MINUTES * 60 * 1000;
export const MAX_ATTEMPTS = 5;
export const RESEND_COOLDOWN_MS = 60 * 1000;
export const DAILY_SEND_CAP = 5;
export const DAY_MS = 24 * 60 * 60 * 1000;

export type VerificationChannel = 'email' | 'phone';
export type VerificationPurpose = 'signup' | 'change';

/** A row of contact_verifications. Only the HMAC of the code is ever stored. */
export interface VerificationRow {
  id: string;
  userId: string;
  channel: string;
  destination: string;
  codeHmac: string;
  purpose: string;
  attempts: number;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
}

export interface NewVerificationRow {
  userId: string;
  channel: VerificationChannel;
  destination: string;
  codeHmac: string;
  purpose: VerificationPurpose;
  expiresAt: Date;
  createdAt: Date;
}

export interface VerificationUser {
  id: string;
  email: string;
  passwordHash: string | null;
  phoneE164: string | null;
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
}

/** 'ok' = stored value changed; 'taken' = unique clash; 'consumed' = code no longer valid. */
export type CompleteChangeResult = 'ok' | 'taken' | 'consumed';

export interface VerificationStore {
  findActiveUser(userId: string): Promise<VerificationUser | null>;
  isEmailTakenByOther(email: string, userId: string): Promise<boolean>;
  isPhoneTakenByOther(phoneE164: string, userId: string): Promise<boolean>;
  latestVerification(userId: string, channel: VerificationChannel): Promise<VerificationRow | null>;
  countSendsSince(
    scope:
      | { userId: string; channel: VerificationChannel }
      | { channel: VerificationChannel; destination: string },
    since: Date,
  ): Promise<number>;
  invalidateOpen(userId: string, channel: VerificationChannel, now: Date): Promise<void>;
  insert(row: NewVerificationRow): Promise<string>;
  invalidate(id: string, now: Date): Promise<void>;
  /** Returns the new attempt count, or null when the code is no longer open for attempts. */
  incrementAttempts(id: string, now: Date): Promise<number | null>;
  completeEmailChange(input: {
    userId: string;
    verificationId: string;
    email: string;
    now: Date;
  }): Promise<CompleteChangeResult>;
  completePhoneChange(input: {
    userId: string;
    verificationId: string;
    phoneE164: string;
    now: Date;
  }): Promise<CompleteChangeResult>;
}

/** Delivery adapter. Resolves true only when the provider accepted the message. Never throws. */
export interface CodeSender {
  sendCode(input: {
    userId: string;
    destination: string;
    code: string;
    expiresInMinutes: number;
  }): Promise<boolean>;
}

export interface VerificationOptions {
  hmacSecret: string;
  isProduction: boolean;
  clock: () => Date;
}

export const VERIFICATION_STORE = Symbol('VERIFICATION_STORE');
export const VERIFICATION_MAIL_SENDER = Symbol('VERIFICATION_MAIL_SENDER');
export const VERIFICATION_SMS_SENDER = Symbol('VERIFICATION_SMS_SENDER');
export const VERIFICATION_OPTIONS = Symbol('VERIFICATION_OPTIONS');
