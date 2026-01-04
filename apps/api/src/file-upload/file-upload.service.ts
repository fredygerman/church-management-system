import * as http from 'http';
import * as https from 'https';
import { randomUUID } from 'crypto';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import config from '../config';

// Local imports
import { ExceptionConstants } from '../core/exceptions/exceptions.constants';

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

export interface FileUploadResult {
  success: boolean;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export type DirectoryType = 'default' | 'profileImages' | 'documents' | 'temp';

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private readonly s3Client: S3Client;
  private readonly maxFileSize: number;
  private readonly s3Config = {
    bucket: config.s3BucketName,
    endpoint: config.s3StorageEndpoint,
    publicUrl: config.s3PublicUrl,
    accessKeyId: config.s3AccessKeyId,
    secretAccessKey: config.s3SecretKeyId,
  };

  constructor() {
    this.maxFileSize = config.maxFileSizeMB * 1024 * 1024;

    // Create S3Client configuration
    const s3ClientConfig: any = {
      region: 'auto',
      endpoint: this.s3Config.endpoint,
      credentials: {
        accessKeyId: this.s3Config.accessKeyId,
        secretAccessKey: this.s3Config.secretAccessKey,
      },
      forcePathStyle: true,
    };

    // In development, allow self-signed certificates
    if (process.env.NODE_ENV === 'development') {
      const httpAgent = new http.Agent({
        keepAlive: true,
        timeout: 120000,
        maxSockets: 50,
      });
      const httpsAgent = new https.Agent({
        rejectUnauthorized: false,
        keepAlive: true,
        timeout: 120000,
        maxSockets: 50,
      });

      s3ClientConfig.requestHandler = new NodeHttpHandler({
        httpAgent,
        httpsAgent,
      });
    }

    this.s3Client = new S3Client(s3ClientConfig);
  }

  private validateFileSize(file: MulterFile): void {
    if (file.size > this.maxFileSize) {
      throw new BadRequestException({
        message: `File size exceeds the limit of ${config.maxFileSizeMB}MB`,
        code: ExceptionConstants.BadRequestCodes.VALIDATION_ERROR,
      });
    }
  }

  private validateFileType(
    file: MulterFile,
    allowedMimeTypes?: string[]
  ): void {
    if (allowedMimeTypes && allowedMimeTypes.length > 0) {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException({
          message: `File type ${file.mimetype} is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`,
          code: ExceptionConstants.BadRequestCodes.VALIDATION_ERROR,
        });
      }
    }
  }

  async uploadToS3(
    file: MulterFile,
    allowedMimeTypes?: string[],
    directory: DirectoryType = 'default'
  ): Promise<FileUploadResult> {
    try {
      this.logger.log(`Uploading ${file.originalname} (${file.size} bytes)`);

      // Validate file
      this.validateFileSize(file);
      this.validateFileType(file, allowedMimeTypes);

      if (!file.buffer) {
        throw new BadRequestException({
          message: 'File buffer is missing',
          code: ExceptionConstants.BadRequestCodes.VALIDATION_ERROR,
        });
      }

      // Generate unique file name with directory prefix
      const fileExtension = file.originalname.split('.').pop();
      const uniqueFileName = `${randomUUID()}.${fileExtension}`;
      const directoryPath = config.s3Directories[directory];
      const s3Key = `${directoryPath}/${uniqueFileName}`;

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.s3Config.bucket,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentLength: file.buffer.length,
        Metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);

      // Construct public URL
      const fileUrl = `${this.s3Config.publicUrl}/${this.s3Config.bucket}/${s3Key}`;

      const result: FileUploadResult = {
        success: true,
        fileUrl,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      };

      this.logger.debug(`File uploaded: ${fileUrl}`);
      return result;
    } catch (error: any) {
      this.logger.error(
        `Upload failed for ${file.originalname}: ${error.message}`
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException({
        message: `File upload failed: ${error.message}`,
        code: ExceptionConstants.BadRequestCodes.FILE_UPLOAD_ERROR,
      });
    }
  }

  async deleteFromS3(key: string): Promise<void> {
    try {
      this.logger.log(`Deleting file from S3: ${key}`);

      const command = new DeleteObjectCommand({
        Bucket: this.s3Config.bucket,
        Key: key,
      });

      await this.s3Client.send(command);

      this.logger.log(`Successfully deleted file from S3: ${key}`);
    } catch (error) {
      this.logger.error(`File deletion failed: ${error.message}`, error.stack);
      throw new BadRequestException({
        message: `File deletion failed: ${error.message}`,
        code: ExceptionConstants.BadRequestCodes.FILE_UPLOAD_ERROR,
      });
    }
  }

  async handleFileUpload(
    file: MulterFile,
    name: string,
    metadata: Record<string, any>,
    folderPath?: string,
    directory: DirectoryType = 'default'
  ): Promise<FileUploadResult> {
    this.logger.log(`Handling file upload: ${name}`);
    return this.uploadToS3(file, config.allowedDocumentTypes, directory);
  }

  async getUserDocuments(userId: string, statuses?: string[]): Promise<any> {
    this.logger.log(`Fetching documents for user: ${userId}`);
    // Return empty array for now - no database integration
    return [];
  }

  async updateDocument(id: string, updates: Record<string, any>): Promise<any> {
    this.logger.log(`Updating document: ${id}`);
    return { success: true };
  }

  async markDocumentAsDeleted(
    id: string,
    userId: string,
    userRole: string
  ): Promise<any> {
    this.logger.log(`Marking document as deleted: ${id}`);
    return { success: true };
  }
}
