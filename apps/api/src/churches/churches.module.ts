import { Module } from '@nestjs/common'
import { ChurchController } from './churches.controller'
import { ChurchService } from './churches.service'

@Module({
  controllers: [ChurchController],
  providers: [ChurchService],
  exports: [ChurchService],
})
export class ChurchModule {}
