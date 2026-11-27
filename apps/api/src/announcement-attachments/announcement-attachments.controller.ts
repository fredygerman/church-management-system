import {
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { AnnouncementAttachmentsService } from './announcement-attachments.service';
import { AttachmentUploadInterceptor } from './attachment-upload.interceptor';
import type {
  AttachmentUploadFile,
  AttachmentUploadResponse,
  AttachmentUrlResponse,
} from './announcement-attachments.types';

interface AttachmentRequest {
  user?: {
    id: string;
    churchId?: string | null;
    activeChurchId?: string | null;
  };
}

@ApiTags('Announcement Attachments')
@Controller('announcement-attachments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class AnnouncementAttachmentsController {
  private readonly logger = new Logger(AnnouncementAttachmentsController.name);

  constructor(private readonly attachmentsService: AnnouncementAttachmentsService) {}

  /**
   * POST /api/announcement-attachments
   * Upload an image (JPEG, PNG, WebP up to 8 MB) or a PDF (up to 10 MB) for an announcement.
   */
  @Post()
  @UseInterceptors(AttachmentUploadInterceptor)
  @RequirePermission('publish:announcements')
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload an announcement attachment',
    description:
      'Stores a private image or PDF after checking its signature. Images have metadata removed.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'Attachment stored' })
  @ApiResponse({
    status: 400,
    description: 'ATTACHMENT_MISSING_FILE, ATTACHMENT_TOO_LARGE, ATTACHMENT_TYPE_UNSUPPORTED or ATTACHMENT_IMAGE_INVALID',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async upload(
    @Request() req: AttachmentRequest,
    @UploadedFile() file?: AttachmentUploadFile,
  ): Promise<AttachmentUploadResponse> {
    const churchId = this.activeChurchId(req);
    const userId = req.user!.id;
    const result = await this.attachmentsService.upload(churchId, userId, file);

    this.logger.log(`User ${userId} uploaded announcement attachment ${result.id}`);

    return result;
  }

  /**
   * GET /api/announcement-attachments/:id/url
   * Signed, 15-minute GET URL for an attachment in the caller's church.
   */
  @Get(':id/url')
  @ApiOperation({
    summary: 'Get a signed URL for an announcement attachment',
    description: 'Returns a short-lived GET URL. Attachments from other churches return 404.',
  })
  @ApiResponse({ status: 200, description: 'Signed URL returned; expiresIn is 900 seconds' })
  @ApiResponse({ status: 404, description: 'ATTACHMENT_NOT_FOUND' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUrl(
    @Request() req: AttachmentRequest,
    @Param('id') id: string,
  ): Promise<AttachmentUrlResponse> {
    return this.attachmentsService.getSignedUrl(this.activeChurchId(req), id);
  }

  private activeChurchId(req: AttachmentRequest): string {
    const churchId = req.user?.activeChurchId ?? req.user?.churchId;
    if (!churchId) {
      throw new ForbiddenException('Church context is required');
    }
    return churchId;
  }
}
