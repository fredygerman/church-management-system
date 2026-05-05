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
import { DatabaseModule } from './database/database.module'
import { FileUploadModule } from './file-upload/file-upload.module'
import { HealthController } from './health/health.controller'
import { ServiceStatusUtil } from './helpers/service-status.util'
import { ChurchModule } from './churches/churches.module'
import { MembersModule } from './members/members.module'
import { ZonesModule } from './zones/zones.module'
import { FamiliesModule } from './families/families.module'
import { VisitorsModule } from './visitors/visitors.module'
import { AttendanceModule } from './attendance/attendance.module'
import { CommunicationsModule } from './communications/communications.module'
import { DataQualityModule } from './data-quality/data-quality.module'
import { FamilyLifecycleModule } from './family-lifecycle/family-lifecycle.module'
import config from './config'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DatabaseModule.forRoot({
      driver: 'node-postgres',
      url: config.databaseURL,
    }),
    AuthModule,
    UsersModule,
    MailModule,
    SmsModule,
    FileUploadModule,
    ChurchModule,
    MembersModule,
    ZonesModule,
    FamiliesModule,
    VisitorsModule,
    AttendanceModule,
    CommunicationsModule,
    DataQualityModule,
    FamilyLifecycleModule,
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
