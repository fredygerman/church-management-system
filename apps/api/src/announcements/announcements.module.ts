import { Module } from '@nestjs/common'
import { AnnouncementsController } from './announcements.controller'
import { DrizzleAnnouncementRepository } from './announcements.repository'
import { AnnouncementsService } from './announcements.service'
import { AnnouncementScheduler } from './announcement-scheduler'
import { ANNOUNCEMENT_REPOSITORY } from './announcements.types'

@Module({
  controllers: [AnnouncementsController],
  providers: [
    AnnouncementsService,
    AnnouncementScheduler,
    { provide: ANNOUNCEMENT_REPOSITORY, useClass: DrizzleAnnouncementRepository },
  ],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}
