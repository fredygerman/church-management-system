/** Largest accepted avatar upload, in bytes (5 MB). */
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

/** Lifetime of the signed GET URL returned to clients, in seconds (15 minutes). */
export const AVATAR_SIGNED_GET_TTL_SECONDS = 15 * 60;

export const AVATAR_ERROR_CODES = {
  MISSING_FILE: 'AVATAR_MISSING_FILE',
  TOO_LARGE: 'AVATAR_TOO_LARGE',
  TYPE_UNSUPPORTED: 'AVATAR_TYPE_UNSUPPORTED',
  IMAGE_INVALID: 'AVATAR_IMAGE_INVALID',
} as const;

export type AvatarImageType = 'image/jpeg' | 'image/png' | 'image/webp';

const EXTENSIONS: Record<AvatarImageType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * Identifies an avatar image from its leading bytes. The client's MIME header
 * is never trusted: SVG, HTML and anything else with a renamed extension
 * returns null.
 */
export function detectAvatarImageType(buffer: Buffer): AvatarImageType | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return 'image/png';
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

/** Private object key layout from D-06/D-07: avatars/{userId}/{uuid}.{ext}. */
export function buildAvatarKey(userId: string, imageType: AvatarImageType, uuid: string): string {
  return `avatars/${userId}/${uuid}.${EXTENSIONS[imageType]}`;
}

/**
 * Removes location and device metadata (EXIF, XMP, IPTC, comments, text chunks)
 * without re-encoding the pixels. JPEG keeps the JFIF header (APP0), the ICC colour
 * profile (APP2) and the Adobe colour marker (APP14) so images still render correctly. Throws on
 * malformed input; callers reject the upload.
 */
export function stripImageMetadata(buffer: Buffer, imageType: AvatarImageType): Buffer {
  switch (imageType) {
    case 'image/jpeg':
      return stripJpeg(buffer);
    case 'image/png':
      return stripPng(buffer);
    case 'image/webp':
      return stripWebp(buffer);
  }
}

// APP0 (JFIF header), APP2 (ICC profile) and APP14 (Adobe colour marker) carry no personal data.
const JPEG_KEEP_APP = new Set([0xe0, 0xe2, 0xee]);
const JPEG_EOI = Buffer.from([0xff, 0xd9]);

function stripJpeg(buffer: Buffer): Buffer {
  const out: Buffer[] = [Buffer.from([0xff, 0xd8])];
  let i = 2;
  while (i < buffer.length) {
    if (buffer[i] !== 0xff) throw new Error('Malformed JPEG: expected a marker');
    let j = i;
    while (j < buffer.length && buffer[j] === 0xff) j++;
    if (j >= buffer.length) throw new Error('Malformed JPEG: truncated marker');
    const code = buffer[j];

    if (code === 0xd9) {
      out.push(JPEG_EOI);
      return Buffer.concat(out);
    }
    if (code === 0x01 || (code >= 0xd0 && code <= 0xd7)) {
      // Standalone markers carry no length.
      out.push(buffer.subarray(i, j + 1));
      i = j + 1;
      continue;
    }
    if (j + 2 >= buffer.length) throw new Error('Malformed JPEG: truncated segment');
    const length = buffer.readUInt16BE(j + 1);
    if (length < 2) throw new Error('Malformed JPEG: bad segment length');
    const segmentEnd = j + 1 + length;
    if (segmentEnd > buffer.length) throw new Error('Malformed JPEG: segment overruns file');

    const isAppOrComment = (code >= 0xe0 && code <= 0xef) || code === 0xfe;
    const keep = !isAppOrComment || (code >= 0xe0 && code <= 0xef && JPEG_KEEP_APP.has(code));
    if (keep) out.push(buffer.subarray(i, segmentEnd));

    if (code === 0xda) {
      // Entropy-coded data follows the scan header; keep it up to the end-of-image marker.
      const eoi = buffer.indexOf(JPEG_EOI, segmentEnd);
      if (eoi === -1) throw new Error('Malformed JPEG: missing end-of-image');
      out.push(buffer.subarray(segmentEnd, eoi + 2));
      return Buffer.concat(out);
    }
    i = segmentEnd;
  }
  throw new Error('Malformed JPEG: no end-of-image');
}

const PNG_DROP_CHUNKS = new Set(['eXIf', 'tEXt', 'zTXt', 'iTXt', 'tIME']);

function stripPng(buffer: Buffer): Buffer {
  const out: Buffer[] = [PNG_SIGNATURE];
  let i = PNG_SIGNATURE.length;
  while (i + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(i);
    const type = buffer.toString('ascii', i + 4, i + 8);
    const end = i + 12 + length;
    if (end > buffer.length) throw new Error('Malformed PNG: chunk overruns file');
    if (!PNG_DROP_CHUNKS.has(type)) out.push(buffer.subarray(i, end));
    i = end;
    if (type === 'IEND') return Buffer.concat(out);
  }
  throw new Error('Malformed PNG: missing IEND');
}

const WEBP_DROP_CHUNKS = new Set(['EXIF', 'XMP ']);
const VP8X_EXIF_FLAG = 0x08;
const VP8X_XMP_FLAG = 0x04;

function stripWebp(buffer: Buffer): Buffer {
  const chunks: Buffer[] = [];
  let i = 12;
  while (i + 8 <= buffer.length) {
    const start = i;
    const type = buffer.toString('ascii', start, start + 4);
    const size = buffer.readUInt32LE(start + 4);
    const end = start + 8 + size + (size % 2);
    if (end > buffer.length) throw new Error('Malformed WebP: chunk overruns file');
    i = end;
    if (WEBP_DROP_CHUNKS.has(type)) continue;

    const chunk = Buffer.from(buffer.subarray(start, end));
    if (type === 'VP8X' && size >= 1) {
      // Clear the flags that announce the removed EXIF and XMP chunks.
      chunk[8] &= ~(VP8X_EXIF_FLAG | VP8X_XMP_FLAG);
    }
    chunks.push(chunk);
  }
  const body = Buffer.concat([Buffer.from('WEBP', 'ascii'), ...chunks]);
  const header = Buffer.alloc(8);
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(body.length, 4);
  return Buffer.concat([header, body]);
}
