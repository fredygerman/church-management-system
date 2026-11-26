import { Module } from '@nestjs/common'
import { EventsController } from './events.controller'
import { EventsService } from './events.service'
import { MembersModule } from '../members/members.module'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [MembersModule, NotificationsModule],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
