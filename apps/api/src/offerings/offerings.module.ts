import { Module } from '@nestjs/common'
import { OfferingCategoriesController, OfferingsController } from './offerings.controller'
import { OfferingsService } from './offerings.service'
import { GivingGoalsController } from './giving-goals.controller'
import { GivingGoalsService } from './giving-goals.service'
import { MembersModule } from '../members/members.module'

@Module({
  imports: [MembersModule],
  controllers: [OfferingCategoriesController, OfferingsController, GivingGoalsController],
  providers: [OfferingsService, GivingGoalsService],
  exports: [OfferingsService, GivingGoalsService],
})
export class OfferingsModule {}
