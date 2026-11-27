/**
 * Byte fixtures for announcement attachment tests. Not a spec file: shared by
 * attachment-file.spec.ts and announcement-attachments.service.spec.ts.
 */

export const MB = 1024 * 1024;

/** One JPEG segment: marker, 2-byte length (payload + 2), payload. */
export function jpegSegment(code: number, payload: Buffer): Buffer {
  const length = Buffer.alloc(2);
  length.writeUInt16BE(payload.length + 2, 0);
  return Buffer.concat([Buffer.from([0xff, code]), length, payload]);
}

/** Well-formed JPEG carrying an APP1 Exif segment with a GPS string. */
export function jpegWithExif(): Buffer {
  return Buffer.concat([
    Buffer.from([0xff, 0xd8]),
    jpegSegment(0xe0, Buffer.from('JFIF\0\x01\x01\0\0\x01\0\x01\0\0', 'binary')),
    jpegSegment(0xe1, Buffer.from('Exif\0\0GPSLatitude=-6.8', 'ascii')),
    jpegSegment(0xda, Buffer.from([0x01, 0x01, 0x00, 0x00, 0x3f, 0x00])),
    Buffer.from([0x12, 0x34, 0x56]),
    Buffer.from([0xff, 0xd9]),
  ]);
}

/** Well-formed JPEG of exactly `totalBytes` bytes, for size-limit tests. */
export function jpegOfSize(totalBytes: number): Buffer {
  const head = Buffer.concat([
    Buffer.from([0xff, 0xd8]),
    jpegSegment(0xda, Buffer.from([0x01, 0x01, 0x00, 0x00, 0x3f, 0x00])),
  ]);
  const tail = Buffer.from([0xff, 0xd9]);
  const filler = Buffer.alloc(totalBytes - head.length - tail.length, 0x11);
  return Buffer.concat([head, filler, tail]);
}

/** JPEG start-of-image with no end-of-image: passes magic-byte detection, fails stripping. */
export function truncatedJpeg(): Buffer {
  return Buffer.concat([
    Buffer.from([0xff, 0xd8]),
    jpegSegment(0xe1, Buffer.from('Exif\0\0GPSLatitude=-6.8', 'ascii')),
    Buffer.from([0x12, 0x34]),
  ]);
}

/** Minimal well-formed PNG: signature, empty IHDR-shaped chunk, IEND. */
export function minimalPng(): Buffer {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const chunk = (type: string, data: Buffer) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    return Buffer.concat([length, Buffer.from(type, 'ascii'), data, Buffer.alloc(4)]);
  };
  return Buffer.concat([signature, chunk('IHDR', Buffer.alloc(13)), chunk('IEND', Buffer.alloc(0))]);
}

/** Minimal PDF body beginning with the %PDF- header. */
export function minimalPdf(extraBytes = 0): Buffer {
  const body = Buffer.from('%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n', 'ascii');
  return extraBytes > 0 ? Buffer.concat([body, Buffer.alloc(extraBytes, 0x20)]) : body;
}

/** A PDF of exactly `totalBytes` bytes. */
export function pdfOfSize(totalBytes: number): Buffer {
  const header = Buffer.from('%PDF-1.7\n', 'ascii');
  const trailer = Buffer.from('\n%%EOF\n', 'ascii');
  return Buffer.concat([header, Buffer.alloc(totalBytes - header.length - trailer.length, 0x20), trailer]);
}

export const SVG_PAYLOAD = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(1)</script></svg>',
  'utf8',
);
