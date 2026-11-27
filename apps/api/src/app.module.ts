import { Module } from '@nestjs/common'
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { AppService } from './app.service'
import { ResponseInterceptor, ErrorInterceptor } from './common/interceptors'
import { SmsModule } from './sms/sms.module'
import { JwtAuthGuard } from './auth/guards'
import { ChurchContextGuard } from './auth/guards/church-context.guard'
import { PermissionGuard } from './auth/guards/permission.guard'
import { ZoneContextGuard } from './auth/guards/zone-context.guard'
import { DepartmentContextGuard } from './auth/guards/department-context.guard'
import { MailModule } from './mail/mail.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { AppController } from './app.controller'
import { ScheduleModule } from '@nestjs/schedule'
import { DatabaseModule } from './database/database.module'
import { FileUploadModule } from './file-upload/file-upload.module'
import { HealthController } from './health/health.controller'
import { ServiceStatusUtil } from './helpers/service-status.util'
import { InvitationsModule } from './invitations/invitations.module'
import { VerificationModule } from './verification/verification.module'
import { AnnouncementAttachmentsModule } from './announcement-attachments/announcement-attachments.module'
import { ChurchModule } from './churches/churches.module'
import { MembersModule } from './members/members.module'
import { ZonesModule } from './zones/zones.module'
import { DepartmentsModule } from './departments/departments.module'
import { FamiliesModule } from './families/families.module'
import { VisitorsModule } from './visitors/visitors.module'
import { AttendanceModule } from './attendance/attendance.module'
import { CommunicationsModule } from './communications/communications.module'
import { DataQualityModule } from './data-quality/data-quality.module'
import { FamilyLifecycleModule } from './family-lifecycle/family-lifecycle.module'
import { PrayerModule } from './prayer/prayer.module'
import { OfferingsModule } from './offerings/offerings.module'
import { EventsModule } from './events/events.module'
import { DashboardModule } from './dashboard/dashboard.module'
import { AiModule } from './ai/ai.module'
import { RetentionModule } from './retention/retention.module'
import { LibraryModule } from './library/library.module'
import { PublicModule } from './public/public.module'
import { NotificationsModule } from './notifications/notifications.module'
import config from './config'

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
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
    // Before ChurchModule: GET /churches/invitations must not match GET /churches/:id.
    InvitationsModule,
    VerificationModule,
    AnnouncementAttachmentsModule,
    ChurchModule,
    MembersModule,
    ZonesModule,
    DepartmentsModule,
    FamiliesModule,
    VisitorsModule,
    AttendanceModule,
    CommunicationsModule,
    DataQualityModule,
    FamilyLifecycleModule,
    PrayerModule,
    OfferingsModule,
    EventsModule,
    DashboardModule,
    AiModule,
    RetentionModule,
    LibraryModule,
    PublicModule,
    NotificationsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    ServiceStatusUtil,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
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
    {
      provide: APP_GUARD,
      useClass: DepartmentContextGuard,
    },
  ],
})
export class AppModule {}
