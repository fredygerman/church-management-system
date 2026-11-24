import { Module } from '@nestjs/common'
import { AttendanceModule } from '../attendance/attendance.module'
import { EventsModule } from '../events/events.module'
import { FileUploadModule } from '../file-upload/file-upload.module'
import { MembersModule } from '../members/members.module'
import { AiController } from './ai.controller'
import { AiService } from './ai.service'
import { AiReadTools } from './ai-tools'
import { AiConversationStore } from './ai-conversation.store'

@Module({
  imports: [MembersModule, EventsModule, FileUploadModule, AttendanceModule],
  controllers: [AiController],
  providers: [AiService, AiReadTools, AiConversationStore],
})
export class AiModule {}
