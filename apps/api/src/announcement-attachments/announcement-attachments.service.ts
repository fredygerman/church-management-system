import { randomUUID } from 'crypto';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { FileUploadService } from '../file-upload/file-upload.service';
import { detectAttachmentType, prepareAttachmentBody, sanitizeAttachmentName } from './attachment-file';
import {
  ANNOUNCEMENT_ATTACHMENT_REPOSITORY,
  ATTACHMENT_ERROR_CODES,
  ATTACHMENT_URL_TTL_SECONDS,
  type AnnouncementAttachmentRepository,
  type AttachmentUploadFile,
  type AttachmentUploadResponse,
  type AttachmentUrlResponse,
} from './announcement-attachments.types';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class AnnouncementAttachmentsService {
  private readonly logger = new Logger(AnnouncementAttachmentsService.name);

  constructor(
    @Inject(ANNOUNCEMENT_ATTACHMENT_REPOSITORY)
    private readonly repository: AnnouncementAttachmentRepository,
    private readonly fileUploadService: FileUploadService,
  ) {}

  /**
   * Stores a private image or PDF for use in an announcement. The type comes from
   * the file's magic bytes; images are stripped of metadata before storage.
   */
  async upload(
    churchId: string,
    uploadedBy: string | null,
    file: AttachmentUploadFile | undefined,
  ): Promise<AttachmentUploadResponse> {
    const buffer = file?.buffer;
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException({
        message: 'A file is required',
        code: ATTACHMENT_ERROR_CODES.MISSING_FILE,
      });
    }

    const type = detectAttachmentType(buffer);
    if (!type) {
      throw new BadRequestException({
        message: 'Attachments must be a JPEG, PNG, WebP image or a PDF',
        code: ATTACHMENT_ERROR_CODES.TYPE_UNSUPPORTED,
      });
    }

    if (buffer.length > type.maxBytes) {
      const limitMb = type.maxBytes / (1024 * 1024);
      throw new BadRequestException({
        message: `${type.kind === 'image' ? 'Images' : 'PDF files'} must be ${limitMb} MB or smaller`,
        code: ATTACHMENT_ERROR_CODES.TOO_LARGE,
      });
    }

    // Metadata is removed before the object is written; the original bytes are never stored.
    const body = prepareAttachmentBody(buffer, type);
    const storageKey = `announcements/${churchId}/${randomUUID()}.${type.extension}`;
    const name = sanitizeAttachmentName(file?.originalname);

    await this.storeObject(storageKey, body, type.contentType);

    let id: string;
    try {
      id = await this.repository.insert({
        churchId,
        uploadedBy,
        kind: type.kind,
        contentType: type.contentType,
        originalName: name,
        sizeBytes: body.length,
        storageKey,
      });
    } catch (error) {
      // Do not leave an orphaned object when no row references it.
      await this.deleteObjectBestEffort(storageKey);
      throw error;
    }

    this.logger.log(`Stored announcement attachment ${id}`);

    return {
      id,
      kind: type.kind,
      name,
      contentType: type.contentType,
      size: body.length,
    };
  }

  /**
   * Returns a short-lived signed GET URL for an attachment in the caller's church.
   * Another church's id and an unknown id produce the same 404.
   */
  async getSignedUrl(churchId: string, attachmentId: string): Promise<AttachmentUrlResponse> {
    if (!UUID_PATTERN.test(attachmentId)) {
      throw this.notFound();
    }

    const ref = await this.repository.findStorageRef(churchId, attachmentId);
    if (!ref) {
      throw this.notFound();
    }

    let url: string;
    try {
      url = await this.fileUploadService.getSignedGetUrl(ref.storageKey, ATTACHMENT_URL_TTL_SECONDS);
    } catch (error: any) {
      this.logger.warn(`Attachment URL signing failed for ${attachmentId}: ${error?.name ?? 'Error'}`);
      throw new ServiceUnavailableException('Attachment storage is unavailable');
    }

    return { url, expiresIn: ATTACHMENT_URL_TTL_SECONDS };
  }

  private notFound(): NotFoundException {
    return new NotFoundException({
      message: 'Attachment not found',
      code: ATTACHMENT_ERROR_CODES.NOT_FOUND,
    });
  }

  private async storeObject(key: string, body: Buffer, contentType: string): Promise<void> {
    try {
      await this.fileUploadService.putPrivateObject(key, body, contentType);
    } catch (error: any) {
      this.logger.error(`Announcement attachment storage failed: ${error?.name ?? 'Error'}`);
      throw new ServiceUnavailableException('Attachment storage is unavailable');
    }
  }

  private async deleteObjectBestEffort(key: string): Promise<void> {
    try {
      await this.fileUploadService.deleteFromS3(key);
    } catch (error: any) {
      this.logger.warn(`Announcement attachment cleanup failed: ${error?.name ?? 'Error'}`);
    }
  }
}
