import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { SmsModule } from '../sms/sms.module';
import config from '../config';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { DrizzleVerificationStore } from './verification.store';
import { MailCodeSender, SmsCodeSender } from './verification.senders';
import {
  VERIFICATION_MAIL_SENDER,
  VERIFICATION_OPTIONS,
  VERIFICATION_SMS_SENDER,
  VERIFICATION_STORE,
  VerificationOptions,
} from './verification.types';

@Module({
  imports: [MailModule, SmsModule],
  controllers: [VerificationController],
  providers: [
    VerificationService,
    DrizzleVerificationStore,
    { provide: VERIFICATION_STORE, useExisting: DrizzleVerificationStore },
    { provide: VERIFICATION_MAIL_SENDER, useClass: MailCodeSender },
    { provide: VERIFICATION_SMS_SENDER, useClass: SmsCodeSender },
    {
      provide: VERIFICATION_OPTIONS,
      useFactory: (): VerificationOptions => ({
        // Uses the existing session secret; no new env name. It is not shared with JWT signing.
        hmacSecret: config.session.secret,
        isProduction: process.env.NODE_ENV === 'production',
        clock: () => new Date(),
      }),
    },
  ],
  exports: [VerificationService],
})
export class VerificationModule {}
