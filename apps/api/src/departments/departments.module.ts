import { Module } from '@nestjs/common'
import { DepartmentsController } from './departments.controller'
import { DepartmentsService } from './departments.service'
import { MembersModule } from '../members/members.module'

@Module({
  imports: [MembersModule],
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}
