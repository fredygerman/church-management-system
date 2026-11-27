import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { normalizeTzPhone } from '../../../../packages/config/src/utils/phone';
import {
  CODE_TTL_MINUTES,
  CODE_TTL_MS,
  CodeSender,
  DAILY_SEND_CAP,
  DAY_MS,
  MAX_ATTEMPTS,
  RESEND_COOLDOWN_MS,
  VERIFICATION_MAIL_SENDER,
  VERIFICATION_OPTIONS,
  VERIFICATION_SMS_SENDER,
  VERIFICATION_STORE,
  VerificationChannel,
  VerificationOptions,
  VerificationPurpose,
  VerificationRow,
  VerificationStore,
  VerificationUser,
} from './verification.types';
import {
  generateCode,
  hashCode,
  hashesMatch,
  isUsableHmacSecret,
} from './verification.crypto';

export interface StartEmailInput {
  email: string;
  purpose: VerificationPurpose;
  currentPassword?: string;
}

export interface CodeSentResult {
  status: 'sent';
  expiresAt: string;
}

const INVALID_CODE_MESSAGE = 'The code is not valid.';

/**
 * Contact verification (D-04): 6-digit codes, HMAC-stored, 10-minute TTL,
 * 5 attempts, 60-second resend cooldown, 5 sends per day per user and per
 * destination. A stored email or phone changes only after a correct code.
 */
@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    @Inject(VERIFICATION_STORE) private readonly store: VerificationStore,
    @Inject(VERIFICATION_MAIL_SENDER) private readonly mailSender: CodeSender,
    @Inject(VERIFICATION_SMS_SENDER) private readonly smsSender: CodeSender,
    @Inject(VERIFICATION_OPTIONS) private readonly options: VerificationOptions,
  ) {}

  async startEmail(userId: string, input: StartEmailInput): Promise<CodeSentResult> {
    this.assertUsable();
    const user = await this.loadUser(userId);
    const email = input.email.trim().toLowerCase();

    if (input.purpose === 'change') {
      await this.assertCurrentPassword(user, input.currentPassword);
      if (email === user.email.toLowerCase()) {
        throw new BadRequestException({
          code: 'EMAIL_UNCHANGED',
          message: 'That is already your email address.',
        });
      }
    }

    if (await this.store.isEmailTakenByOther(email, userId)) {
      throw new ConflictException({
        code: 'EMAIL_IN_USE',
        message: 'That email address is already in use.',
      });
    }

    return this.issueCode({
      userId,
      channel: 'email',
      destination: email,
      purpose: input.purpose,
      sender: this.mailSender,
    });
  }

  async confirmEmail(userId: string, code: string): Promise<{ emailVerified: true; verifiedAt: string }> {
    const now = this.now();
    const row = await this.checkCode(userId, 'email', code, now);
    const result = await this.store.completeEmailChange({
      userId,
      verificationId: row.id,
      email: row.destination,
      now,
    });

    if (result === 'taken') {
      throw new ConflictException({
        code: 'EMAIL_IN_USE',
        message: 'That email address is already in use.',
      });
    }
    if (result === 'consumed') {
      throw new BadRequestException({ code: 'INVALID_CODE', message: INVALID_CODE_MESSAGE });
    }
    return { emailVerified: true, verifiedAt: now.toISOString() };
  }

  async startPhone(userId: string, rawPhone: string): Promise<CodeSentResult> {
    this.assertUsable();
    const user = await this.loadUser(userId);
    const phone = normalizeTzPhone(rawPhone);
    if (!phone) {
      throw new UnprocessableEntityException({
        code: 'INVALID_PHONE',
        message: 'Enter a Tanzanian mobile number, for example 0712 345 678.',
      });
    }

    if (await this.store.isPhoneTakenByOther(phone, userId)) {
      throw new ConflictException({
        code: 'PHONE_IN_USE',
        message: 'That phone number is already in use.',
      });
    }

    return this.issueCode({
      userId,
      channel: 'phone',
      destination: phone,
      purpose: user.phoneE164 ? 'change' : 'signup',
      sender: this.smsSender,
    });
  }

  async confirmPhone(userId: string, code: string): Promise<{ phoneVerified: true; verifiedAt: string }> {
    const now = this.now();
    const row = await this.checkCode(userId, 'phone', code, now);
    const result = await this.store.completePhoneChange({
      userId,
      verificationId: row.id,
      phoneE164: row.destination,
      now,
    });

    if (result === 'taken') {
      throw new ConflictException({
        code: 'PHONE_IN_USE',
        message: 'That phone number is already in use.',
      });
    }
    if (result === 'consumed') {
      throw new BadRequestException({ code: 'INVALID_CODE', message: INVALID_CODE_MESSAGE });
    }
    return { phoneVerified: true, verifiedAt: now.toISOString() };
  }

  private async issueCode(args: {
    userId: string;
    channel: VerificationChannel;
    destination: string;
    purpose: VerificationPurpose;
    sender: CodeSender;
  }): Promise<CodeSentResult> {
    const { userId, channel, destination, purpose, sender } = args;
    const now = this.now();

    const latest = await this.store.latestVerification(userId, channel);
    if (latest) {
      const elapsedMs = now.getTime() - latest.createdAt.getTime();
      if (elapsedMs < RESEND_COOLDOWN_MS) {
        throw new HttpException(
          {
            code: 'RESEND_COOLDOWN',
            message: 'Please wait before requesting another code.',
            retryAfterSeconds: Math.ceil((RESEND_COOLDOWN_MS - elapsedMs) / 1000),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const since = new Date(now.getTime() - DAY_MS);
    const [sendsForUser, sendsForDestination] = await Promise.all([
      this.store.countSendsSince({ userId, channel }, since),
      this.store.countSendsSince({ channel, destination }, since),
    ]);
    if (sendsForUser >= DAILY_SEND_CAP || sendsForDestination >= DAILY_SEND_CAP) {
      throw new HttpException(
        {
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many codes have been requested today. Try again tomorrow.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = generateCode();
    const expiresAt = new Date(now.getTime() + CODE_TTL_MS);
    // A new code replaces any open one, so only the latest code can be entered.
    await this.store.invalidateOpen(userId, channel, now);
    const verificationId = await this.store.insert({
      userId,
      channel,
      destination,
      codeHmac: hashCode(this.options.hmacSecret, channel, destination, code),
      purpose,
      expiresAt,
      createdAt: now,
    });

    const delivered = await sender
      .sendCode({ userId, destination, code, expiresInMinutes: CODE_TTL_MINUTES })
      .catch(() => false);

    if (!delivered) {
      await this.store.invalidate(verificationId, now);
      this.logger.warn(
        `Verification code delivery failed (channel=${channel}, purpose=${purpose}, user=${userId})`,
      );
      throw new ServiceUnavailableException({
        code: 'DELIVERY_FAILED',
        message: 'We could not send the code. Please try again later.',
      });
    }

    this.logger.log(
      `Verification code sent (channel=${channel}, purpose=${purpose}, user=${userId})`,
    );
    return { status: 'sent', expiresAt: expiresAt.toISOString() };
  }

  /** Returns the open row when the code matches. Counts every attempt and locks the code at MAX_ATTEMPTS. */
  private async checkCode(
    userId: string,
    channel: VerificationChannel,
    code: string,
    now: Date,
  ): Promise<VerificationRow> {
    const row = await this.store.latestVerification(userId, channel);
    if (!row) {
      throw new BadRequestException({ code: 'INVALID_CODE', message: INVALID_CODE_MESSAGE });
    }

    if (row.consumedAt) {
      if (row.attempts >= MAX_ATTEMPTS) {
        throw this.tooManyAttempts();
      }
      throw new BadRequestException({ code: 'INVALID_CODE', message: INVALID_CODE_MESSAGE });
    }

    if (row.expiresAt.getTime() <= now.getTime()) {
      throw new HttpException(
        { code: 'CODE_EXPIRED', message: 'That code has expired. Request a new one.' },
        HttpStatus.GONE,
      );
    }

    const attempts = await this.store.incrementAttempts(row.id, now);
    if (attempts === null) {
      throw this.tooManyAttempts();
    }

    const expected = hashCode(this.options.hmacSecret, channel, row.destination, code);
    if (hashesMatch(expected, row.codeHmac)) {
      return row;
    }

    if (attempts >= MAX_ATTEMPTS) {
      await this.store.invalidate(row.id, now);
      throw this.tooManyAttempts();
    }

    throw new BadRequestException({
      code: 'INVALID_CODE',
      message: INVALID_CODE_MESSAGE,
      attemptsRemaining: MAX_ATTEMPTS - attempts,
    });
  }

  private async assertCurrentPassword(
    user: VerificationUser,
    currentPassword: string | undefined,
  ): Promise<void> {
    if (!user.passwordHash) {
      return;
    }
    if (!currentPassword) {
      throw new ForbiddenException({
        code: 'PASSWORD_REQUIRED',
        message: 'Enter your current password to change your email address.',
      });
    }
    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) {
      throw new ForbiddenException({
        code: 'INVALID_PASSWORD',
        message: 'The current password is incorrect.',
      });
    }
  }

  private async loadUser(userId: string): Promise<VerificationUser> {
    const user = await this.store.findActiveUser(userId);
    if (!user) {
      throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User not found' });
    }
    return user;
  }

  private assertUsable(): void {
    if (!isUsableHmacSecret(this.options.hmacSecret, this.options.isProduction)) {
      this.logger.error(
        'Verification is disabled: the HMAC secret is missing or a placeholder in production',
      );
      throw new ServiceUnavailableException({
        code: 'VERIFICATION_UNAVAILABLE',
        message: 'Verification is not available right now.',
      });
    }
  }

  private tooManyAttempts(): HttpException {
    return new HttpException(
      {
        code: 'TOO_MANY_ATTEMPTS',
        message: 'Too many incorrect attempts. Request a new code.',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  private now(): Date {
    return this.options.clock();
  }
}
