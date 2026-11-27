/** Upper bounds for announcement attachments, in bytes. */
export const ATTACHMENT_LIMITS = {
  IMAGE_MAX_BYTES: 8 * 1024 * 1024,
  PDF_MAX_BYTES: 10 * 1024 * 1024,
} as const;

/** Lifetime of the signed GET URL returned to members, in seconds (15 minutes). */
export const ATTACHMENT_URL_TTL_SECONDS = 15 * 60;

/** Longest stored display name, in characters. */
export const ATTACHMENT_NAME_MAX_CHARS = 120;

export const ATTACHMENT_ERROR_CODES = {
  MISSING_FILE: 'ATTACHMENT_MISSING_FILE',
  TOO_LARGE: 'ATTACHMENT_TOO_LARGE',
  TYPE_UNSUPPORTED: 'ATTACHMENT_TYPE_UNSUPPORTED',
  IMAGE_INVALID: 'ATTACHMENT_IMAGE_INVALID',
  NOT_FOUND: 'ATTACHMENT_NOT_FOUND',
} as const;

export type AttachmentKind = 'image' | 'file';

export type AttachmentContentType = 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';

/** Multer file as received on the 'file' multipart field. */
export interface AttachmentUploadFile {
  buffer?: Buffer;
  size?: number;
  originalname?: string;
}

/** Row written by the repository after a successful object upload. */
export interface NewAttachmentRecord {
  churchId: string;
  uploadedBy: string | null;
  kind: AttachmentKind;
  contentType: AttachmentContentType;
  originalName: string;
  sizeBytes: number;
  storageKey: string;
}

/** Body returned by POST /announcement-attachments. Never contains the storage key. */
export interface AttachmentUploadResponse {
  id: string;
  kind: AttachmentKind;
  name: string;
  contentType: AttachmentContentType;
  size: number;
}

/** Body returned by GET /announcement-attachments/:id/url. Never contains the storage key. */
export interface AttachmentUrlResponse {
  url: string;
  expiresIn: number;
}

/**
 * Persistence seam for attachment rows. The Drizzle implementation is wired in
 * the module; services depend on this interface only, so they stay testable
 * without a database.
 */
export interface AnnouncementAttachmentRepository {
  /** Inserts the row and returns its id. */
  insert(record: NewAttachmentRecord): Promise<string>;
  /** Finds an attachment by id within one church. Returns null for other churches. */
  findStorageRef(churchId: string, attachmentId: string): Promise<{ storageKey: string } | null>;
}

export const ANNOUNCEMENT_ATTACHMENT_REPOSITORY = Symbol('ANNOUNCEMENT_ATTACHMENT_REPOSITORY');
