import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { SmsService } from '../sms/sms.service';
import { CodeSender } from './verification.types';

// Adapters over the existing providers. They never throw and never log the
// message body, because it carries the code.

@Injectable()
export class MailCodeSender implements CodeSender {
  private readonly logger = new Logger(MailCodeSender.name);

  constructor(private readonly mailService: MailService) {}

  async sendCode(input: {
    userId: string;
    destination: string;
    code: string;
    expiresInMinutes: number;
  }): Promise<boolean> {
    try {
      const result = await this.mailService.sendEmail({
        to: input.destination,
        subject: 'Your verification code',
        text:
          `Your verification code is ${input.code}. ` +
          `It expires in ${input.expiresInMinutes} minutes. ` +
          'If you did not ask for this code, you can ignore this email.',
      });
      return result.success;
    } catch (error) {
      this.logger.error(
        `Verification email send failed for user ${input.userId}: ${(error as Error)?.name ?? 'unknown error'}`,
      );
      return false;
    }
  }
}

@Injectable()
export class SmsCodeSender implements CodeSender {
  private readonly logger = new Logger(SmsCodeSender.name);

  constructor(private readonly smsService: SmsService) {}

  async sendCode(input: {
    userId: string;
    destination: string;
    code: string;
    expiresInMinutes: number;
  }): Promise<boolean> {
    try {
      // Codes must never be written to notifications or logged: use the non-persisting path.
      const result = await this.smsService.sendSensitiveSms({
        to: input.destination,
        text:
          `Your verification code is ${input.code}. ` +
          `It expires in ${input.expiresInMinutes} minutes. Do not share it.`,
        purpose: 'verification_code',
      });
      return result.ok;
    } catch (error) {
      this.logger.error(
        `Verification SMS send failed for user ${input.userId}: ${(error as Error)?.name ?? 'unknown error'}`,
      );
      return false;
    }
  }
}
