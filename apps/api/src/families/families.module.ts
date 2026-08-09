import { Module } from '@nestjs/common'
import { FamiliesController } from './families.controller'
import { FamiliesService } from './families.service'
import { MembersModule } from '../members/members.module'

@Module({
  imports: [MembersModule],
  controllers: [FamiliesController],
  providers: [FamiliesService],
  exports: [FamiliesService],
})
export class FamiliesModule {}
