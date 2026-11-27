import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { FileUploadModule } from '../file-upload/file-upload.module';
import { AuthModule } from '../auth/auth.module';
import { AnnouncementAttachmentsController } from './announcement-attachments.controller';
import { AnnouncementAttachmentsService } from './announcement-attachments.service';
import { DrizzleAnnouncementAttachmentRepository } from './announcement-attachments.repository';
import { ANNOUNCEMENT_ATTACHMENT_REPOSITORY } from './announcement-attachments.types';

@Module({
  imports: [DatabaseModule, FileUploadModule, AuthModule],
  controllers: [AnnouncementAttachmentsController],
  providers: [
    AnnouncementAttachmentsService,
    DrizzleAnnouncementAttachmentRepository,
    {
      provide: ANNOUNCEMENT_ATTACHMENT_REPOSITORY,
      useExisting: DrizzleAnnouncementAttachmentRepository,
    },
  ],
  exports: [AnnouncementAttachmentsService],
})
export class AnnouncementAttachmentsModule {}
