import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Logger,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Req,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';

// Local imports
import {
  FileUploadService,
  FileUploadResult,
  DirectoryType,
} from './file-upload.service';
import config from '../config';
import { JwtAuthGuard } from '../auth/guards';
import { Public } from '../auth/decorators/public.decorator';
import { AuthenticatedRequest } from '../auth/dto/auth-request.dto';
import { ExceptionConstants } from '../core/exceptions/exceptions.constants';

// Define Express Multer File type locally
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer?: Buffer;
}

// Define VerificationStatus enum for file uploads
enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  NO_VERIFICATION_NEEDED = 'no_verification_needed',
}

const { maxFileSizeMB, allowedDocumentTypes } = config;

@Controller('api/files')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}
  private readonly logger = new Logger(FileUploadController.name);

  @Get('health')
  @Public()
  async healthCheck() {
    this.logger.log('Health check requested');
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'File upload service is running',
    };
  }

  @Post('diagnostics')
  @Public()
  @UseInterceptors(FileInterceptor('file'))
  async runDiagnostics(@UploadedFile() file?: MulterFile): Promise<any> {
    this.logger.log('========== DIAGNOSTICS START ==========');
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      checks: {},
    };

    // Check 1: Environment variables
    this.logger.log('Check 1: Environment variables');
    diagnostics.checks.environment = {
      nodeEnv: process.env.NODE_ENV,
      s3Endpoint: config.s3StorageEndpoint,
      s3BucketName: config.s3BucketName,
      s3PublicUrl: config.s3PublicUrl,
      s3AccessKeyId: config.s3AccessKeyId
        ? `${config.s3AccessKeyId.substring(0, 5)}...`
        : 'NOT SET',
      s3SecretKeyId: config.s3SecretKeyId ? '***' : 'NOT SET',
    };

    // Check 2: File information (if provided)
    if (file) {
      this.logger.log('Check 2: File information');
      diagnostics.checks.file = {
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        hasBuffer: !!file.buffer,
        bufferSize: file.buffer?.length || 0,
      };

      // Attempt test upload
      try {
        this.logger.log('Attempting test upload...');
        const result = await this.fileUploadService.uploadToS3(file as any);
        diagnostics.checks.upload = {
          status: 'success',
          fileUrl: result.fileUrl,
          uploadedAt: result.uploadedAt,
        };
        this.logger.log('Test upload successful');
      } catch (error: any) {
        diagnostics.checks.upload = {
          status: 'failed',
          error: error.message,
          code: error.Code,
        };
        this.logger.error('Test upload failed:', error.message);
      }
    } else {
      diagnostics.checks.file = {
        status: 'no file provided for testing',
      };
    }

    this.logger.log('========== DIAGNOSTICS END ==========');
    return diagnostics;
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        displayName: { type: 'string' },
        metadata: { type: 'string' },
        folderPath: { type: 'string' },
        tags: { type: 'string' },
        status: { type: 'string' },
        documentType: { type: 'string' },
        directory: { type: 'string' },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  // @UseInterceptors(FileExtender)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: MulterFile,
    @Body('name') name: string,
    @Body('displayName') displayName?: string,
    @Body('metadata') metadata?: string,
    @Body('folderPath') folderPath?: string,
    @Body('tags') tags?: string,
    @Body('status') status?: string,
    @Body('documentType') documentType?: string,
    @Body('directory') directory?: DirectoryType,
    @Req() req?: AuthenticatedRequest
  ): Promise<FileUploadResult> {
    this.logger.log('Uploading file with auth, name:', name);

    if (!req?.user?.id) {
      throw new BadRequestException({
        message: 'User information not found',
        code: ExceptionConstants.BadRequestCodes.VALIDATION_ERROR,
      });
    }

    // Validate file and name
    this.validateFileUpload(file, name);

    // Parse and validate metadata
    const parsedMetadata = this.parseAndValidateMetadata({
      metadata,
      displayName,
      tags,
      status,
      documentType,
    });

    // Add user data to metadata
    parsedMetadata.userId = req.user.id;
    parsedMetadata.userRole = req.user.role || 'visitor';
    parsedMetadata.userEmail = req.user.email;
    parsedMetadata.displayName = displayName || name;
    parsedMetadata.directory = directory || 'default';

    this.logger.log('Parsed metadata with user data:', parsedMetadata);

    return this.fileUploadService.handleFileUpload(
      file as any,
      name,
      parsedMetadata,
      folderPath,
      directory || 'default'
    );
  }

  @Post('public-upload')
  @Public()
  @UseInterceptors(FileInterceptor('file'))
  async uploadPublicFile(
    @UploadedFile() file: MulterFile,
    @Body('name') name: string,
    @Body('displayName') displayName?: string,
    @Body('metadata') metadata?: string,
    @Body('folderPath') folderPath?: string,
    @Body('tags') tags?: string,
    @Body('directory') directory?: DirectoryType
  ): Promise<FileUploadResult> {
    this.logger.log('Uploading public file, name:', name);

    // Validate file and name
    this.validateFileUpload(file, name);

    // Parse and validate metadata
    const parsedMetadata = this.parseAndValidateMetadata({
      metadata,
      displayName,
      tags,
      isPublic: true,
    });

    // Add flag to indicate this is a public upload
    parsedMetadata.isPublicUpload = true;
    parsedMetadata.documentType = 'public';
    parsedMetadata.status = 'no_verification_needed';
    parsedMetadata.directory = directory || 'default';

    this.logger.log('Parsed metadata for public upload:', parsedMetadata);

    return this.fileUploadService.handleFileUpload(
      file as any,
      name,
      parsedMetadata,
      folderPath,
      directory || 'default'
    );
  }

  private validateFileUpload(file: MulterFile, name: string): void {
    if (!name) {
      throw new BadRequestException({
        message: 'Document name is required',
        code: ExceptionConstants.BadRequestCodes.VALIDATION_ERROR,
      });
    }

    if (!file) {
      throw new BadRequestException({
        message: 'No file uploaded',
        code: ExceptionConstants.BadRequestCodes.VALIDATION_ERROR,
      });
    }

    // File size validation (done here for early rejection)
    const maxSize = maxFileSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException({
        message: `File size exceeds the limit of ${maxFileSizeMB}MB`,
        code: ExceptionConstants.BadRequestCodes.VALIDATION_ERROR,
      });
    }

    // File type validation
    if (!allowedDocumentTypes.includes(file.mimetype)) {
      throw new BadRequestException({
        message: `File type ${file.mimetype} is not allowed. Allowed types: ${allowedDocumentTypes.join(
          ', '
        )}`,
        code: ExceptionConstants.BadRequestCodes.VALIDATION_ERROR,
      });
    }
  }

  private parseAndValidateMetadata({
    metadata,
    displayName,
    tags,
    status,
    documentType,
    isPublic = false,
  }: {
    metadata?: string;
    displayName?: string;
    tags?: string;
    status?: string;
    documentType?: string;
    isPublic?: boolean;
  }): Record<string, any> {
    let parsedMetadata: Record<string, any> = {};

    // Parse base metadata if provided
    if (metadata) {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch (error) {
        throw new BadRequestException({
          message: 'Invalid metadata format. Must be valid JSON.',
          code: ExceptionConstants.BadRequestCodes.VALIDATION_ERROR,
        });
      }
    }

    // Add display name
    if (displayName) {
      parsedMetadata.displayName = displayName;
    }

    // Parse and validate tags
    if (tags) {
      try {
        const parsedTags = JSON.parse(tags);
        if (Array.isArray(parsedTags)) {
          parsedMetadata.tags = parsedTags;
        } else {
          throw new BadRequestException({
            message: 'Invalid tags format. Must be a JSON array.',
            code: ExceptionConstants.BadRequestCodes.VALIDATION_ERROR,
          });
        }
      } catch (error) {
        throw new BadRequestException({
          message: 'Invalid tags format. Must be a JSON array.',
          code: ExceptionConstants.BadRequestCodes.VALIDATION_ERROR,
        });
      }
    }

    // Validate status if provided
    if (status && !isPublic) {
      const validStatuses = Object.values(VerificationStatus);
      if (!validStatuses.includes(status as any)) {
        throw new BadRequestException({
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          code: ExceptionConstants.BadRequestCodes.VALIDATION_ERROR,
        });
      }
      parsedMetadata.status = status;
    }

    // Validate document type if provided
    if (documentType && !isPublic) {
      // Accept any string as document type for now
      parsedMetadata.documentType = documentType;
    }

    return parsedMetadata;
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  async getUserDocuments(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: string | string[]
  ) {
    if (!req.user?.id) {
      throw new BadRequestException({
        message: 'User information not found',
        code: ExceptionConstants.BadRequestCodes.VALIDATION_ERROR,
      });
    }

    // Convert single status to array
    const statusArray = status
      ? Array.isArray(status)
        ? status
        : [status]
      : undefined;

    // Validate statuses if provided
    if (statusArray?.length) {
      const validStatuses = Object.values(VerificationStatus);
      const invalidStatuses = statusArray.filter(
        s => !validStatuses.includes(s as any)
      );

      if (invalidStatuses.length) {
        throw new BadRequestException({
          message: `Invalid status filter(s): ${invalidStatuses.join(', ')}. Must be one of: ${validStatuses.join(', ')}`,
          code: ExceptionConstants.BadRequestCodes.VALIDATION_ERROR,
        });
      }
    }

    return this.fileUploadService.getUserDocuments(
      req.user.id,
      statusArray as any
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  async updateDocument(
    @Param('id') id: string,
    @Body('displayName') displayName?: string,
    @Body('status') status?: string,
    @Req() req?: AuthenticatedRequest
  ) {
    this.logger.log(`Updating document ${id}`);

    if (!req?.user?.id || !req?.user?.role) {
      throw new BadRequestException({
        message: 'User information not found',
        code: ExceptionConstants.BadRequestCodes.VALIDATION_ERROR,
      });
    }

    return this.fileUploadService.updateDocument(id, {
      displayName,
      status,
      userId: req.user.id,
      userRole: req.user.role,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  async deleteDocument(
    @Param('id') id: string,
    @Req() req?: AuthenticatedRequest
  ) {
    this.logger.log(`Soft deleting document ${id}`);

    if (!req?.user?.id || !req?.user?.role) {
      throw new BadRequestException({
        message: 'User information not found',
        code: ExceptionConstants.BadRequestCodes.VALIDATION_ERROR,
      });
    }

    return this.fileUploadService.markDocumentAsDeleted(
      id,
      req.user.id,
      req.user.role
    );
  }
}
