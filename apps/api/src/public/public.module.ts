import { Module } from '@nestjs/common'
import { PublicChurchController } from './public-church.controller'
import { PublicChurchService } from './public-church.service'

@Module({
  controllers: [PublicChurchController],
  providers: [PublicChurchService],
  exports: [PublicChurchService],
})
export class PublicModule {}
