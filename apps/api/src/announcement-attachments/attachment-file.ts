import { BadRequestException } from '@nestjs/common';
import {
  detectAvatarImageType,
  stripImageMetadata,
  type AvatarImageType,
} from '../users/avatar-image';
import {
  ATTACHMENT_ERROR_CODES,
  ATTACHMENT_LIMITS,
  ATTACHMENT_NAME_MAX_CHARS,
  type AttachmentContentType,
  type AttachmentKind,
} from './announcement-attachments.types';

export interface InspectedAttachment {
  kind: AttachmentKind;
  contentType: AttachmentContentType;
  extension: 'jpg' | 'png' | 'webp' | 'pdf';
  maxBytes: number;
}

const IMAGE_EXTENSIONS: Record<AvatarImageType, 'jpg' | 'png' | 'webp'> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const PDF_HEADER = Buffer.from('%PDF-', 'ascii');

/**
 * Identifies an attachment from its leading bytes only. The client's MIME type
 * and file name are never trusted, so an SVG or HTML file renamed to .pdf (or a
 * PDF renamed to .jpg) is rejected. Returns null for anything else.
 */
export function detectAttachmentType(buffer: Buffer): InspectedAttachment | null {
  const image = detectAvatarImageType(buffer);
  if (image) {
    return {
      kind: 'image',
      contentType: image,
      extension: IMAGE_EXTENSIONS[image],
      maxBytes: ATTACHMENT_LIMITS.IMAGE_MAX_BYTES,
    };
  }
  if (buffer.length >= PDF_HEADER.length && buffer.subarray(0, PDF_HEADER.length).equals(PDF_HEADER)) {
    return {
      kind: 'file',
      contentType: 'application/pdf',
      extension: 'pdf',
      maxBytes: ATTACHMENT_LIMITS.PDF_MAX_BYTES,
    };
  }
  return null;
}

/**
 * Returns the bytes to store. Images have location and device metadata removed;
 * PDFs are stored as received. A malformed image is rejected with a 400.
 */
export function prepareAttachmentBody(buffer: Buffer, type: InspectedAttachment): Buffer {
  if (type.kind === 'file') {
    return buffer;
  }
  try {
    return stripImageMetadata(buffer, type.contentType as AvatarImageType);
  } catch {
    throw new BadRequestException({
      message: 'Image could not be read',
      code: ATTACHMENT_ERROR_CODES.IMAGE_INVALID,
    });
  }
}

/**
 * Reduces a client-supplied file name to a display name: the final path segment
 * only, without control characters, at most 120 characters. Falls back to
 * 'attachment' when nothing usable remains.
 */
export function sanitizeAttachmentName(raw: string | undefined): string {
  const lastSegment = (raw ?? '').split(/[\\/]/).pop() ?? '';
  const printable = lastSegment.replace(/[\u0000-\u001f\u007f-\u009f]/g, '').trim();
  const truncated = Array.from(printable).slice(0, ATTACHMENT_NAME_MAX_CHARS).join('');
  return truncated.length > 0 ? truncated : 'attachment';
}
