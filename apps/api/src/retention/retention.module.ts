import { Module } from '@nestjs/common'
import { FileUploadModule } from '../file-upload/file-upload.module'
import { RetentionService } from './retention.service'

@Module({
  imports: [FileUploadModule],
  providers: [RetentionService],
})
export class RetentionModule {}
