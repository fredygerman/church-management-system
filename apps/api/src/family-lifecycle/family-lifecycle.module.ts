import { Module } from '@nestjs/common'
import { FamilyLifecycleController } from './family-lifecycle.controller'
import { FamilyLifecycleService } from './family-lifecycle.service'

@Module({
  controllers: [FamilyLifecycleController],
  providers: [FamilyLifecycleService],
  exports: [FamilyLifecycleService],
})
export class FamilyLifecycleModule {}
