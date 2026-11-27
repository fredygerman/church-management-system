import { BadRequestException } from '@nestjs/common';
import {
  detectAttachmentType,
  prepareAttachmentBody,
  sanitizeAttachmentName,
} from './attachment-file';
import { ATTACHMENT_LIMITS } from './announcement-attachments.types';
import {
  jpegWithExif,
  minimalPdf,
  minimalPng,
  SVG_PAYLOAD,
  truncatedJpeg,
} from './attachment-test-fixtures';

describe('detectAttachmentType', () => {
  it('accepts a PDF from its %PDF- header', () => {
    expect(detectAttachmentType(minimalPdf())).toEqual(
      expect.objectContaining({ kind: 'file', contentType: 'application/pdf', extension: 'pdf' }),
    );
  });

  it('accepts JPEG, PNG and WebP images from their magic bytes', () => {
    expect(detectAttachmentType(jpegWithExif())).toEqual(
      expect.objectContaining({ kind: 'image', contentType: 'image/jpeg', extension: 'jpg' }),
    );
    expect(detectAttachmentType(minimalPng())).toEqual(
      expect.objectContaining({ kind: 'image', contentType: 'image/png', extension: 'png' }),
    );
    const webp = Buffer.concat([Buffer.from('RIFF', 'ascii'), Buffer.alloc(4), Buffer.from('WEBP', 'ascii')]);
    expect(detectAttachmentType(webp)).toEqual(
      expect.objectContaining({ kind: 'image', contentType: 'image/webp', extension: 'webp' }),
    );
  });

  it('rejects an SVG (with active script) renamed to .pdf', () => {
    // Only the bytes decide the type; the caller's file name and MIME never reach this function.
    expect(detectAttachmentType(SVG_PAYLOAD)).toBeNull();
  });

  it('rejects a PDF header that is not at the start of the file', () => {
    const disguised = Buffer.concat([Buffer.from('<html>padding</html>'), minimalPdf()]);
    expect(detectAttachmentType(disguised)).toBeNull();
  });

  it('rejects empty and unrecognised content', () => {
    expect(detectAttachmentType(Buffer.alloc(0))).toBeNull();
    expect(detectAttachmentType(Buffer.from('GIF89a', 'ascii'))).toBeNull();
  });
});

describe('prepareAttachmentBody', () => {
  it('removes the Exif segment from a JPEG and keeps the image data', () => {
    const type = detectAttachmentType(jpegWithExif())!;
    const body = prepareAttachmentBody(jpegWithExif(), type);

    expect(body.includes(Buffer.from('Exif', 'ascii'))).toBe(false);
    expect(body.includes(Buffer.from('GPSLatitude', 'ascii'))).toBe(false);
    expect(body.subarray(0, 2).equals(Buffer.from([0xff, 0xd8]))).toBe(true);
    expect(body.subarray(body.length - 2).equals(Buffer.from([0xff, 0xd9]))).toBe(true);
  });

  it('stores PDFs unchanged', () => {
    const pdf = minimalPdf();
    expect(prepareAttachmentBody(pdf, detectAttachmentType(pdf)!)).toBe(pdf);
  });

  it('rejects a malformed image with a 400 ATTACHMENT_IMAGE_INVALID', () => {
    const malformed = truncatedJpeg();
    const type = detectAttachmentType(malformed)!;
    expect(() => prepareAttachmentBody(malformed, type)).toThrow(BadRequestException);
    try {
      prepareAttachmentBody(malformed, type);
    } catch (error: any) {
      expect(error.getResponse()).toEqual(expect.objectContaining({ code: 'ATTACHMENT_IMAGE_INVALID' }));
    }
  });
});

describe('sanitizeAttachmentName', () => {
  it('keeps only the final path segment and drops control characters', () => {
    expect(sanitizeAttachmentName('../../etc/passwd')).toBe('passwd');
    expect(sanitizeAttachmentName('C:\\Users\\me\\Order\u0007 form.pdf')).toBe('Order form.pdf');
  });

  it('truncates to 120 characters without splitting a code point', () => {
    const name = `${'a'.repeat(119)}😀${'b'.repeat(10)}`;
    const result = sanitizeAttachmentName(name);
    expect(Array.from(result)).toHaveLength(120);
    expect(result.endsWith('😀')).toBe(true);
  });

  it('falls back to a generic name when nothing usable remains', () => {
    expect(sanitizeAttachmentName(undefined)).toBe('attachment');
    expect(sanitizeAttachmentName('///')).toBe('attachment');
    expect(sanitizeAttachmentName('\u0000\u0001')).toBe('attachment');
  });
});

describe('ATTACHMENT_LIMITS', () => {
  it('matches the product limits: 8 MB images, 10 MB PDFs', () => {
    expect(ATTACHMENT_LIMITS.IMAGE_MAX_BYTES).toBe(8 * 1024 * 1024);
    expect(ATTACHMENT_LIMITS.PDF_MAX_BYTES).toBe(10 * 1024 * 1024);
  });
});
