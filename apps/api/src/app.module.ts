import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppService } from './app.service';
import { SmsModule } from './sms/sms.module';
import { JwtAuthGuard } from './auth/guards';
import { MailModule } from './mail/mail.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AppController } from './app.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { PaymentModule } from './payment/payment.module';
import { DatabaseModule } from './database/database.module';
import { FileUploadModule } from './file-upload/file-upload.module';
import { HealthController } from './health/health.controller';
import { ServiceStatusUtil } from './helpers/service-status.util';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    UsersModule,
    MailModule,
    SmsModule,
    PaymentModule,
    FileUploadModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    ServiceStatusUtil,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
