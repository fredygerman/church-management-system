import { Module } from '@nestjs/common'
import { OfferingCategoriesController, OfferingsController } from './offerings.controller'
import { OfferingsService } from './offerings.service'
import { MembersModule } from '../members/members.module'

@Module({
  imports: [MembersModule],
  controllers: [OfferingCategoriesController, OfferingsController],
  providers: [OfferingsService],
  exports: [OfferingsService],
})
export class OfferingsModule {}
