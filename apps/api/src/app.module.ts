import { Module } from '@nestjs/common'
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { AppService } from './app.service'
import { ResponseInterceptor, ErrorInterceptor } from './common/interceptors'
import { SmsModule } from './sms/sms.module'
import { JwtAuthGuard } from './auth/guards'
import { ChurchContextGuard } from './auth/guards/church-context.guard'
import { PermissionGuard } from './auth/guards/permission.guard'
import { ZoneContextGuard } from './auth/guards/zone-context.guard'
import { MailModule } from './mail/mail.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { AppController } from './app.controller'
import { ScheduleModule } from '@nestjs/schedule'
import { PaymentModule } from './payment/payment.module'
import { DatabaseModule } from './database/database.module'
import { FileUploadModule } from './file-upload/file-upload.module'
import { HealthController } from './health/health.controller'
import { ServiceStatusUtil } from './helpers/service-status.util'
import { ChurchModule } from './churches/churches.module'
import { MembersModule } from './members/members.module'
import { ZonesModule } from './zones/zones.module'
import { FamiliesModule } from './families/families.module'
import { VisitorsModule } from './visitors/visitors.module'

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
    ChurchModule,
    MembersModule,
    ZonesModule,
    FamiliesModule,
    VisitorsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    ServiceStatusUtil,
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ChurchContextGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ZoneContextGuard,
    },
  ],
})
export class AppModule {}
