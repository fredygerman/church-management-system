import * as http from 'http';
import * as https from 'https';
import { randomUUID } from 'crypto';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import config from '../config';
import { and, eq, ilike, isNull } from 'drizzle-orm';
import {
  db,
  documents,
  documentPublicationEvents,
  resourceProgress,
  userChurchMemberships,
} from '@church/db';
import { roleHasPermission } from '../auth/types/permission.types';
import { NotificationsService } from '../notifications/notifications.service';

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

export interface DocumentMetadata {
  id: string;
  churchId: string;
  uploadedBy: string;
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
  title: string;
  description: string | null;
  visibleToMembers: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type LibraryResourceScope = 'network' | 'branch';
export type LibraryPublicationStatus = 'draft' | 'review' | 'published' | 'archived';

export interface LibraryResourceQuery {
  limit?: number;
  cursor?: string;
  query?: string;
  resourceType?: string;
  category?: string;
  branchId?: string;
}

export interface LibraryResource {
  id: string;
  scope: LibraryResourceScope;
  branchId: string;
  title: string;
  description: string | null;
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
  resourceType: string;
  language: string | null;
  authorSpeaker: string | null;
  categories: string[];
  durationSeconds: number | null;
  pageCount: number | null;
  publicationStatus: LibraryPublicationStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LibraryResourceList {
  items: LibraryResource[];
  nextCursor: string | null;
}

export interface ResourceProgressResult {
  resourceId: string;
  positionSeconds: number;
  pageNumber: number | null;
  updatedAt: Date;
}

export interface MemberLibraryDocument {
  id: string;
  title: string;
  description: string | null;
  original_file_name: string;
  content_type: string;
  size_bytes: number;
  created_at: Date;
}

export interface DocumentDownloadUrl {
  url: string;
  expiresAt: string;
}

interface StoredFileUpload extends FileUploadResult {
  storageKey: string;
}

export type DirectoryType = 'default' | 'profileImages' | 'documents' | 'temp';

const MEMBER_DOWNLOAD_URL_EXPIRY_SECONDS = 300;

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

  constructor(private readonly notificationsService: NotificationsService = new NotificationsService()) {
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

  private toDocumentMetadata(document: any): DocumentMetadata {
    return {
      id: document.id,
      churchId: document.churchId,
      uploadedBy: document.uploadedBy,
      originalFileName: document.originalFileName,
      contentType: document.contentType,
      sizeBytes: document.sizeBytes,
      title: document.title,
      description: document.description,
      visibleToMembers: document.visibleToMembers,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }

  private toLibraryResource(document: any): LibraryResource {
    return {
      id: document.id,
      scope: document.scope,
      branchId: document.churchId,
      title: document.title,
      description: document.description,
      originalFileName: document.originalFileName,
      contentType: document.contentType,
      sizeBytes: document.sizeBytes,
      resourceType: document.resourceType,
      language: document.language,
      authorSpeaker: document.authorSpeaker,
      categories: Array.isArray(document.categories) ? document.categories : [],
      durationSeconds: document.durationSeconds,
      pageCount: document.pageCount,
      publicationStatus: document.publicationStatus,
      publishedAt: document.publishedAt,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }

  private async getAuthorizedNetworkIds(userId: string): Promise<Set<string>> {
    const memberships = await db.query.userChurchMemberships.findMany({
      where: and(
        eq(userChurchMemberships.userId, userId),
        eq(userChurchMemberships.status, 'active'),
        isNull(userChurchMemberships.deletedAt),
      ),
      with: { church: true },
    });

    return new Set(
      memberships
        .map((membership: any) => membership.church?.networkId)
        .filter((networkId: unknown): networkId is string => typeof networkId === 'string'),
    );
  }

  private canAccessResource(
    document: any,
    userId: string,
    churchId: string,
    canManageFiles: boolean,
    networkIds: Set<string> = new Set(),
  ): boolean {
    if (!document || document.deletedAt) return false;

    if (canManageFiles && document.churchId === churchId) {
      return true;
    }

    if (document.publicationStatus !== 'published') return false;

    if (document.scope === 'branch') {
      return document.churchId === churchId && document.visibleToMembers === true;
    }

    return Boolean(document.networkId && networkIds.has(document.networkId));
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

  private async uploadObjectToS3(
    file: MulterFile,
    allowedMimeTypes?: string[],
    directory: DirectoryType = 'default'
  ): Promise<StoredFileUpload> {
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
        size: file.buffer.length,
        uploadedAt: new Date().toISOString(),
      };

      this.logger.debug(`File uploaded: ${fileUrl}`);
      return { ...result, storageKey: s3Key };
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

  async uploadToS3(
    file: MulterFile,
    allowedMimeTypes?: string[],
    directory: DirectoryType = 'default'
  ): Promise<FileUploadResult> {
    const { storageKey: _storageKey, ...result } = await this.uploadObjectToS3(
      file,
      allowedMimeTypes,
      directory,
    );
    return result;
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
    const uploaded = await this.uploadObjectToS3(
      file,
      config.allowedDocumentTypes,
      directory,
    );

    const userId = metadata.userId as string | undefined;
    const churchId = metadata.churchId as string | undefined;
    if (!userId || !churchId) {
      await this.deleteFromS3(uploaded.storageKey);
      throw new BadRequestException({
        message: 'Church and user information are required for document metadata',
        code: ExceptionConstants.BadRequestCodes.VALIDATION_ERROR,
      });
    }

    try {
      await db.insert(documents).values({
        churchId,
        uploadedBy: userId,
        originalFileName: file.originalname,
        contentType: file.mimetype,
        sizeBytes: file.buffer?.length ?? file.size,
        storageKey: uploaded.storageKey,
        title: (metadata.title || metadata.displayName || name) as string,
        description: (metadata.description as string | undefined) ?? null,
        visibleToMembers: false,
        scope: 'branch',
        publicationStatus: 'draft',
      }).returning();
    } catch (error) {
      try {
        await this.deleteFromS3(uploaded.storageKey);
      } catch (cleanupError: any) {
        this.logger.error(
          `Uploaded document cleanup failed: ${cleanupError.message}`,
          cleanupError.stack,
        );
      }
      throw error;
    }

    const { storageKey: _storageKey, ...result } = uploaded;
    return result;
  }

  async getUserDocuments(
    churchId: string,
    userId: string,
    userRole: string,
  ): Promise<DocumentMetadata[]> {
    this.logger.log(`Fetching documents for user: ${userId} in church: ${churchId}`);

    const canManageFiles = roleHasPermission(userRole as any, 'manage:files');
    const rows = await db.query.documents.findMany({
      where: and(
        eq(documents.churchId, churchId),
        isNull(documents.deletedAt),
        canManageFiles ? undefined : eq(documents.visibleToMembers, true),
      ),
    });

    return rows
      .filter((document: any) => document.publicationStatus == null || document.publicationStatus === 'published')
      .map((document) => this.toDocumentMetadata(document));
  }

  async getMemberLibrary(churchId: string): Promise<MemberLibraryDocument[]> {
    const rows = await db.query.documents.findMany({
      where: and(
        eq(documents.churchId, churchId),
        isNull(documents.deletedAt),
        eq(documents.visibleToMembers, true),
      ),
    });

    return rows
      .filter((document: any) => document.publicationStatus == null || document.publicationStatus === 'published')
      .map((document) => ({
      id: document.id,
      title: document.title,
      description: document.description,
      original_file_name: document.originalFileName,
      content_type: document.contentType,
      size_bytes: document.sizeBytes,
      created_at: document.createdAt,
      }));
  }

  async getMemberDownloadUrl(
    churchId: string,
    id: string,
  ): Promise<DocumentDownloadUrl> {
    const [document] = await db.query.documents.findMany({
      where: and(
        eq(documents.id, id),
        eq(documents.churchId, churchId),
        isNull(documents.deletedAt),
        eq(documents.visibleToMembers, true),
      ),
    });

    if (!document || (document.publicationStatus != null && document.publicationStatus !== 'published')) {
      throw new NotFoundException('Document not found');
    }

    const url = await getSignedUrl(
      this.s3Client as any,
      new GetObjectCommand({
        Bucket: this.s3Config.bucket,
        Key: document.storageKey,
      }),
      { expiresIn: MEMBER_DOWNLOAD_URL_EXPIRY_SECONDS },
    );

    return {
      url,
      expiresAt: new Date(
        Date.now() + MEMBER_DOWNLOAD_URL_EXPIRY_SECONDS * 1000,
      ).toISOString(),
    };
  }

  async listLibraryResources(
    userId: string,
    churchId: string,
    userRole: string,
    input: LibraryResourceQuery = {},
  ): Promise<LibraryResourceList> {
    const canManageFiles = roleHasPermission(userRole as any, 'manage:files');
    const networkIds = await this.getAuthorizedNetworkIds(userId);
    const branchId = input.branchId ?? churchId;
    const cursor = input.cursor ? Number.parseInt(input.cursor, 10) : 0;
    const limit = Math.min(Math.max(input.limit ?? 20, 1), 100);
    const offset = Number.isInteger(cursor) && cursor >= 0 ? cursor : 0;

    const rows = await db.query.documents.findMany({
      where: and(
        isNull(documents.deletedAt),
        input.resourceType ? eq(documents.resourceType, input.resourceType) : undefined,
        input.query ? ilike(documents.title, `%${input.query}%`) : undefined,
      ),
    });

    const visible = rows
      .filter((document: any) => {
        if (document.scope === 'branch' && document.churchId !== branchId) return false;
        if (document.scope === 'branch' && branchId !== churchId) return false;
        if (
          input.category &&
          (!Array.isArray(document.categories) || !document.categories.includes(input.category))
        ) {
          return false;
        }
        return this.canAccessResource(document, userId, churchId, canManageFiles, networkIds);
      })
      .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());

    const page = visible.slice(offset, offset + limit);
    return {
      items: page.map((document: any) => this.toLibraryResource(document)),
      nextCursor: offset + limit < visible.length ? String(offset + limit) : null,
    };
  }

  async getLibraryResource(
    userId: string,
    churchId: string,
    userRole: string,
    id: string,
  ): Promise<LibraryResource> {
    const [document] = await db.query.documents.findMany({
      where: and(eq(documents.id, id), isNull(documents.deletedAt)),
    });
    const canManageFiles = roleHasPermission(userRole as any, 'manage:files');
    const networkIds = await this.getAuthorizedNetworkIds(userId);
    if (!this.canAccessResource(document, userId, churchId, canManageFiles, networkIds)) {
      throw new NotFoundException('Resource not found');
    }
    return this.toLibraryResource(document);
  }

  async getLibraryResourceAccessUrl(
    userId: string,
    churchId: string,
    userRole: string,
    id: string,
  ): Promise<DocumentDownloadUrl> {
    const [document] = await db.query.documents.findMany({
      where: and(eq(documents.id, id), isNull(documents.deletedAt)),
    });
    const canManageFiles = roleHasPermission(userRole as any, 'manage:files');
    const networkIds = await this.getAuthorizedNetworkIds(userId);
    if (!this.canAccessResource(document, userId, churchId, canManageFiles, networkIds)) {
      throw new NotFoundException('Resource not found');
    }

    const url = await getSignedUrl(
      this.s3Client as any,
      new GetObjectCommand({ Bucket: this.s3Config.bucket, Key: document.storageKey }),
      { expiresIn: MEMBER_DOWNLOAD_URL_EXPIRY_SECONDS },
    );

    return {
      url,
      expiresAt: new Date(Date.now() + MEMBER_DOWNLOAD_URL_EXPIRY_SECONDS * 1000).toISOString(),
    };
  }

  async updateLibraryResource(
    userId: string,
    churchId: string,
    id: string,
    input: {
      title?: string;
      description?: string | null;
      resourceType?: string;
      language?: string | null;
      authorSpeaker?: string | null;
      categories?: string[];
      durationSeconds?: number | null;
      pageCount?: number | null;
      scope?: LibraryResourceScope;
    },
  ): Promise<LibraryResource> {
    const [current] = await db.query.documents.findMany({
      where: and(eq(documents.id, id), eq(documents.churchId, churchId), isNull(documents.deletedAt)),
    });
    if (!current) throw new NotFoundException('Resource not found');

    let networkId = current.networkId;
    if (input.scope === 'network') {
      const memberships = await db.query.userChurchMemberships.findMany({
        where: and(
          eq(userChurchMemberships.userId, userId),
          eq(userChurchMemberships.churchId, churchId),
          eq(userChurchMemberships.status, 'active'),
          isNull(userChurchMemberships.deletedAt),
        ),
        with: { church: true },
      });
      networkId = memberships[0]?.church?.networkId ?? null;
      if (!networkId) throw new BadRequestException('An explicit network is required for network resources');
    } else if (input.scope === 'branch') {
      networkId = null;
    }

    const [updated] = await db
      .update(documents)
      .set({
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.resourceType !== undefined ? { resourceType: input.resourceType } : {}),
        ...(input.language !== undefined ? { language: input.language } : {}),
        ...(input.authorSpeaker !== undefined ? { authorSpeaker: input.authorSpeaker } : {}),
        ...(input.categories !== undefined ? { categories: input.categories } : {}),
        ...(input.durationSeconds !== undefined ? { durationSeconds: input.durationSeconds } : {}),
        ...(input.pageCount !== undefined ? { pageCount: input.pageCount } : {}),
        ...(input.scope !== undefined ? { scope: input.scope, networkId } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(documents.id, id), eq(documents.churchId, churchId), isNull(documents.deletedAt)))
      .returning();

    if (!updated) throw new NotFoundException('Resource not found');
    return this.toLibraryResource(updated);
  }

  async transitionLibraryResource(
    userId: string,
    churchId: string,
    id: string,
    targetStatus: LibraryPublicationStatus,
  ): Promise<LibraryResource> {
    const [current] = await db.query.documents.findMany({
      where: and(eq(documents.id, id), eq(documents.churchId, churchId), isNull(documents.deletedAt)),
    });
    if (!current) throw new NotFoundException('Resource not found');

    const allowed: Record<LibraryPublicationStatus, LibraryPublicationStatus[]> = {
      draft: ['review'],
      review: ['published', 'draft'],
      published: ['archived', 'draft'],
      archived: ['draft'],
    };
    if (!allowed[current.publicationStatus as LibraryPublicationStatus]?.includes(targetStatus)) {
      throw new BadRequestException(`Invalid resource transition: ${current.publicationStatus} -> ${targetStatus}`);
    }

    const now = new Date();
    const [updated] = await db
      .update(documents)
      .set({
        publicationStatus: targetStatus,
        visibleToMembers: targetStatus === 'published',
        publishedAt: targetStatus === 'published' ? now : null,
        publishedBy: targetStatus === 'published' ? userId : null,
        updatedAt: now,
      })
      .where(and(eq(documents.id, id), eq(documents.churchId, churchId), isNull(documents.deletedAt)))
      .returning();

    if (!updated) throw new NotFoundException('Resource not found');
    await db.insert(documentPublicationEvents).values({
      documentId: id,
      actorId: userId,
      fromStatus: current.publicationStatus,
      toStatus: targetStatus,
      createdAt: now,
    });
    if (targetStatus === 'published') {
      await this.notificationsService.notifyChurchMembers({
        churchId: updated.churchId,
        type: 'document_published',
        templateKey: 'library.document_published',
        templateData: { title: updated.title },
        targetType: 'library_resource',
        targetParams: { resourceId: updated.id },
        sourceKey: `document-published:${updated.id}`,
      });
    }
    return this.toLibraryResource(updated);
  }

  async getResourceProgress(
    userId: string,
    churchId: string,
    userRole: string,
    resourceId: string,
  ): Promise<ResourceProgressResult | null> {
    const [document] = await db.query.documents.findMany({
      where: and(eq(documents.id, resourceId), isNull(documents.deletedAt)),
    });
    const canManageFiles = roleHasPermission(userRole as any, 'manage:files');
    const networkIds = await this.getAuthorizedNetworkIds(userId);
    if (!this.canAccessResource(document, userId, churchId, canManageFiles, networkIds)) {
      throw new NotFoundException('Resource not found');
    }
    const [progress] = await db.query.resourceProgress.findMany({
      where: and(eq(resourceProgress.resourceId, resourceId), eq(resourceProgress.userId, userId)),
    });
    return progress
      ? {
          resourceId,
          positionSeconds: progress.positionSeconds,
          pageNumber: progress.pageNumber,
          updatedAt: progress.updatedAt,
        }
      : null;
  }

  async updateResourceProgress(
    userId: string,
    churchId: string,
    userRole: string,
    resourceId: string,
    input: { positionSeconds?: number; pageNumber?: number | null },
  ): Promise<ResourceProgressResult> {
    const [document] = await db.query.documents.findMany({
      where: and(eq(documents.id, resourceId), isNull(documents.deletedAt)),
    });
    const canManageFiles = roleHasPermission(userRole as any, 'manage:files');
    const networkIds = await this.getAuthorizedNetworkIds(userId);
    if (!this.canAccessResource(document, userId, churchId, canManageFiles, networkIds)) {
      throw new NotFoundException('Resource not found');
    }

    const positionSeconds = Math.min(
      Math.max(input.positionSeconds ?? 0, 0),
      document.durationSeconds ?? 2147483647,
    );
    const pageNumber =
      input.pageNumber == null
        ? null
        : Math.min(Math.max(input.pageNumber, 1), document.pageCount ?? 2147483647);
    const now = new Date();
    const [progress] = await db
      .insert(resourceProgress)
      .values({ resourceId, userId, positionSeconds, pageNumber, updatedAt: now })
      .onConflictDoUpdate({
        target: [resourceProgress.resourceId, resourceProgress.userId],
        set: { positionSeconds, pageNumber, updatedAt: now },
      })
      .returning();

    return {
      resourceId,
      positionSeconds: progress.positionSeconds,
      pageNumber: progress.pageNumber,
      updatedAt: progress.updatedAt,
    };
  }

  async updateDocument(
    churchId: string,
    id: string,
    userId: string,
    userRole: string,
    updates: Pick<Partial<DocumentMetadata>, 'title' | 'description' | 'visibleToMembers'>,
  ): Promise<DocumentMetadata> {
    this.logger.log(`Updating document: ${id}`);

    const set: {
      title?: string;
      description?: string | null;
      visibleToMembers?: boolean;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };
    if (updates.title !== undefined) set.title = updates.title;
    if (updates.description !== undefined) set.description = updates.description;
    if (updates.visibleToMembers !== undefined) set.visibleToMembers = updates.visibleToMembers;
    if (set.title === undefined && set.description === undefined && set.visibleToMembers === undefined) {
      throw new BadRequestException('At least one of title, description or visibleToMembers is required');
    }

    const canManageFiles = roleHasPermission(userRole as any, 'manage:files');
    const [updated] = await db
      .update(documents)
      .set(set)
      .where(
        and(
          eq(documents.id, id),
          eq(documents.churchId, churchId),
          isNull(documents.deletedAt),
          canManageFiles ? undefined : eq(documents.uploadedBy, userId),
        ),
      )
      .returning();

    if (!updated) {
      throw new NotFoundException('Document not found');
    }

    return this.toDocumentMetadata(updated);
  }

  async markDocumentAsDeleted(
    churchId: string,
    id: string,
    userId: string,
    userRole: string
  ): Promise<{ success: true }> {
    this.logger.log(`Marking document as deleted: ${id}`);

    const canManageFiles = roleHasPermission(userRole as any, 'manage:files');
    const [deleted] = await db
      .update(documents)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(documents.id, id),
          eq(documents.churchId, churchId),
          isNull(documents.deletedAt),
          canManageFiles ? undefined : eq(documents.uploadedBy, userId),
        ),
      )
      .returning({ id: documents.id });

    if (!deleted) {
      throw new NotFoundException('Document not found');
    }

    return { success: true };
  }
}
