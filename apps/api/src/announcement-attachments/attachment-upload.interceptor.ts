import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  PayloadTooLargeException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ATTACHMENT_ERROR_CODES, ATTACHMENT_LIMITS } from './announcement-attachments.types';

/**
 * Multipart limits for the 'file' field. The buffer limit is the largest allowed
 * type (PDF); images between 8 and 10 MB are rejected by the service. Field and
 * part counts are capped so a request cannot exhaust memory with extra parts.
 */
const ATTACHMENT_UPLOAD_LIMITS = {
  fileSize: ATTACHMENT_LIMITS.PDF_MAX_BYTES,
  files: 1,
  fields: 12,
  parts: 14,
  fieldSize: 64 * 1024,
  headerPairs: 200,
} as const;

const SingleFileUpload = FileInterceptor('file', { limits: ATTACHMENT_UPLOAD_LIMITS });

/**
 * Parses the 'file' multipart field. A body over the buffer limit is reported as
 * ATTACHMENT_TOO_LARGE (400) rather than the framework's 413.
 */
@Injectable()
export class AttachmentUploadInterceptor implements NestInterceptor {
  private readonly upload = new SingleFileUpload();

  async intercept(context: ExecutionContext, next: CallHandler) {
    try {
      return await this.upload.intercept(context, next);
    } catch (error) {
      if (error instanceof PayloadTooLargeException) {
        throw new BadRequestException({
          message: 'File is too large',
          code: ATTACHMENT_ERROR_CODES.TOO_LARGE,
        });
      }
      throw error;
    }
  }
}
