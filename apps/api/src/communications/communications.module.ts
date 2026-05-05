import { Module } from '@nestjs/common'
import { CommunicationsController } from './communications.controller'
import { CommunicationsService } from './communications.service'
import { SmsModule } from '../sms/sms.module'
import { MailModule } from '../mail/mail.module'

@Module({
  imports: [SmsModule, MailModule],
  controllers: [CommunicationsController],
  providers: [CommunicationsService],
  exports: [CommunicationsService],
})
export class CommunicationsModule {}
