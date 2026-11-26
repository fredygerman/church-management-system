import { Module } from '@nestjs/common'
import { FileUploadModule } from '../file-upload/file-upload.module'
import { LibraryController } from './library.controller'

@Module({
  imports: [FileUploadModule],
  controllers: [LibraryController],
})
export class LibraryModule {}
