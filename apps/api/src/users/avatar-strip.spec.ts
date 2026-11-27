import { stripImageMetadata } from './avatar-image';

const jpegSegment = (code: number, payload: Buffer) => {
  const length = Buffer.alloc(2);
  length.writeUInt16BE(payload.length + 2, 0);
  return Buffer.concat([Buffer.from([0xff, code]), length, payload]);
};

const pngChunk = (type: string, data: Buffer) => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  return Buffer.concat([length, Buffer.from(type, 'ascii'), data, Buffer.alloc(4)]);
};

const webpChunk = (type: string, data: Buffer) => {
  const header = Buffer.alloc(8);
  header.write(type, 0, 'ascii');
  header.writeUInt32LE(data.length, 4);
  const pad = data.length % 2 ? Buffer.alloc(1) : Buffer.alloc(0);
  return Buffer.concat([header, data, pad]);
};

describe('stripImageMetadata', () => {
  describe('JPEG', () => {
    const scanHeader = jpegSegment(0xda, Buffer.from([0x01, 0x01, 0x00, 0x00, 0x3f, 0x00]));
    const scanData = Buffer.from([0x12, 0x34, 0xff, 0x00, 0x56]);
    const jpeg = Buffer.concat([
      Buffer.from([0xff, 0xd8]),
      jpegSegment(0xe0, Buffer.from('JFIF\0\x01\x01\0\0\x01\0\x01\0\0', 'binary')),
      jpegSegment(0xe1, Buffer.from('Exif\0\0GPSLatitude=-6.8', 'ascii')),
      jpegSegment(0xfe, Buffer.from('comment secret', 'ascii')),
      jpegSegment(0xe2, Buffer.from('ICC_PROFILE_KEEP', 'ascii')),
      jpegSegment(0xed, Buffer.from('Photoshop IPTC', 'ascii')),
      jpegSegment(0xdb, Buffer.from([0x00, 0x01, 0x02])),
      scanHeader,
      scanData,
      Buffer.from([0xff, 0xd9]),
      Buffer.from('TRAILER-AFTER-EOI', 'ascii'),
    ]);

    it('removes EXIF, comments and IPTC but keeps JFIF, ICC and the scan', () => {
      const out = stripImageMetadata(jpeg, 'image/jpeg');
      const text = out.toString('latin1');
      expect(text).not.toContain('Exif');
      expect(text).not.toContain('GPSLatitude');
      expect(text).not.toContain('comment secret');
      expect(text).not.toContain('Photoshop');
      expect(text).not.toContain('TRAILER-AFTER-EOI');
      expect(text).toContain('JFIF');
      expect(text).toContain('ICC_PROFILE_KEEP');
      expect(out.includes(scanData)).toBe(true);
      expect(out.subarray(out.length - 2).equals(Buffer.from([0xff, 0xd9]))).toBe(true);
    });

    it('throws on a truncated JPEG', () => {
      expect(() => stripImageMetadata(jpeg.subarray(0, 40), 'image/jpeg')).toThrow();
    });
  });

  describe('PNG', () => {
    const png = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      pngChunk('IHDR', Buffer.alloc(13)),
      pngChunk('tEXt', Buffer.from('Comment\0secret place', 'ascii')),
      pngChunk('eXIf', Buffer.from('GPS-data', 'ascii')),
      pngChunk('IDAT', Buffer.from([1, 2, 3, 4])),
      pngChunk('IEND', Buffer.alloc(0)),
    ]);

    it('removes text and EXIF chunks and keeps image chunks', () => {
      const out = stripImageMetadata(png, 'image/png');
      const text = out.toString('latin1');
      expect(text).not.toContain('secret place');
      expect(text).not.toContain('GPS-data');
      expect(text).toContain('IHDR');
      expect(text).toContain('IDAT');
      expect(out.subarray(out.length - 8, out.length - 4).toString('ascii')).toBe('IEND');
    });

    it('throws when IEND is missing', () => {
      const noEnd = png.subarray(0, png.length - 12);
      expect(() => stripImageMetadata(noEnd, 'image/png')).toThrow();
    });
  });

  describe('WebP', () => {
    const vp8x = Buffer.alloc(10);
    vp8x[0] = 0x0c; // EXIF (0x08) and XMP (0x04) flags set
    const webp = Buffer.concat([
      Buffer.from('RIFF', 'ascii'),
      Buffer.alloc(4),
      Buffer.from('WEBP', 'ascii'),
      webpChunk('VP8X', vp8x),
      webpChunk('EXIF', Buffer.from('GPS5', 'ascii')),
      webpChunk('XMP ', Buffer.from('xmp!', 'ascii')),
      webpChunk('VP8L', Buffer.from('abcd', 'ascii')),
    ]);
    webp.writeUInt32LE(webp.length - 8, 4);

    it('removes EXIF and XMP chunks, clears their flags and fixes the RIFF size', () => {
      const out = stripImageMetadata(webp, 'image/webp');
      const text = out.toString('latin1');
      expect(text).not.toContain('GPS5');
      expect(text).not.toContain('xmp!');
      expect(text).toContain('VP8L');
      expect(out.toString('ascii', 0, 4)).toBe('RIFF');
      expect(out.readUInt32LE(4)).toBe(out.length - 8);
      expect(out[20] & 0x0c).toBe(0);
    });
  });
});
