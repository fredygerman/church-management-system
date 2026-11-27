import { Module } from '@nestjs/common'
import { VersesController } from './verses.controller'
import { VersesRepository } from './verses.repository'
import { VersesService } from './verses.service'

@Module({
  controllers: [VersesController],
  providers: [VersesService, VersesRepository],
  exports: [VersesService],
})
export class VersesModule {}
