import { Module } from '@nestjs/common'
import { PrayerController } from './prayer.controller'
import { PrayerService } from './prayer.service'
import { MembersModule } from '../members/members.module'

@Module({
  imports: [MembersModule],
  controllers: [PrayerController],
  providers: [PrayerService],
  exports: [PrayerService],
})
export class PrayerModule {}
