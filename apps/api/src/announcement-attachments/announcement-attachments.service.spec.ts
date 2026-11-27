import { randomUUID } from 'crypto';
import { BadRequestException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { AnnouncementAttachmentsService } from './announcement-attachments.service';
import { ATTACHMENT_ERROR_CODES, ATTACHMENT_LIMITS, type NewAttachmentRecord } from './announcement-attachments.types';
import {
  jpegOfSize,
  jpegWithExif,
  MB,
  minimalPdf,
  minimalPng,
  pdfOfSize,
  SVG_PAYLOAD,
  truncatedJpeg,
} from './attachment-test-fixtures';

const CHURCH_A = '11111111-1111-4111-8111-111111111111';
const CHURCH_B = '22222222-2222-4222-8222-222222222222';
const STAFF_ID = '33333333-3333-4333-8333-333333333333';

interface StoredRow extends NewAttachmentRecord {
  id: string;
}

function makeRepository() {
  const rows: StoredRow[] = [];
  return {
    rows,
    insert: jest.fn(async (record: NewAttachmentRecord) => {
      const id = randomUUID();
      rows.push({ id, ...record });
      return id;
    }),
    findStorageRef: jest.fn(async (churchId: string, attachmentId: string) => {
      const row = rows.find((r) => r.id === attachmentId && r.churchId === churchId);
      return row ? { storageKey: row.storageKey } : null;
    }),
  };
}

function makeStorage() {
  const objects = new Map<string, { body: Buffer; contentType: string }>();
  return {
    objects,
    putPrivateObject: jest.fn(async (key: string, body: Buffer, contentType: string) => {
      objects.set(key, { body, contentType });
      return key;
    }),
    getSignedGetUrl: jest.fn(
      async (key: string, expiresIn: number) =>
        `https://storage.example.test/bucket/${key}?X-Amz-Expires=${expiresIn}&X-Amz-Signature=abc`,
    ),
    deleteFromS3: jest.fn(async (key: string) => {
      objects.delete(key);
    }),
  };
}

function setup() {
  const repository = makeRepository();
  const storage = makeStorage();
  const service = new AnnouncementAttachmentsService(repository as any, storage as any);
  return { service, repository, storage };
}

async function expectBadRequest(promise: Promise<unknown>, code: string) {
  const error: any = await promise.then(
    () => undefined,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(BadRequestException);
  expect(error.getResponse()).toEqual(expect.objectContaining({ code }));
}

describe('AnnouncementAttachmentsService.upload', () => {
  it('stores a PDF privately and returns the response body without the storage key', async () => {
    const { service, storage, repository } = setup();

    const result = await service.upload(CHURCH_A, STAFF_ID, {
      buffer: minimalPdf(),
      originalname: 'Parish newsletter.pdf',
    });

    expect(result).toEqual({
      id: expect.any(String),
      kind: 'file',
      name: 'Parish newsletter.pdf',
      contentType: 'application/pdf',
      size: minimalPdf().length,
    });
    const [key] = [...storage.objects.keys()];
    expect(key).toMatch(new RegExp(`^announcements/${CHURCH_A}/[0-9a-f-]{36}\\.pdf$`));
    expect(storage.objects.get(key)!.contentType).toBe('application/pdf');
    expect(repository.rows[0]).toEqual(expect.objectContaining({ churchId: CHURCH_A, uploadedBy: STAFF_ID, storageKey: key }));

    // The response must not expose where the object lives.
    expect(JSON.stringify(result)).not.toContain('announcements/');
    expect(Object.keys(result).sort()).toEqual(['contentType', 'id', 'kind', 'name', 'size']);
  });

  it('stores a JPEG with its Exif segment removed', async () => {
    const { service, storage } = setup();

    const result = await service.upload(CHURCH_A, STAFF_ID, {
      buffer: jpegWithExif(),
      originalname: 'camera.jpg',
    });

    expect(result.kind).toBe('image');
    expect(result.contentType).toBe('image/jpeg');
    const [key, stored] = [...storage.objects.entries()][0];
    expect(key.endsWith('.jpg')).toBe(true);
    expect(stored.contentType).toBe('image/jpeg');
    expect(stored.body.includes(Buffer.from('Exif', 'ascii'))).toBe(false);
    expect(stored.body.includes(Buffer.from('GPSLatitude', 'ascii'))).toBe(false);
    expect(result.size).toBe(stored.body.length);
  });

  it('accepts a PNG', async () => {
    const { service } = setup();
    const result = await service.upload(CHURCH_A, STAFF_ID, { buffer: minimalPng(), originalname: 'chart.png' });
    expect(result).toEqual(expect.objectContaining({ kind: 'image', contentType: 'image/png' }));
  });

  it('decides the type from bytes, not from the file name or MIME: a PDF named photo.jpg is stored as a PDF', async () => {
    const { service, storage } = setup();

    const result = await service.upload(CHURCH_A, STAFF_ID, {
      buffer: minimalPdf(),
      originalname: 'photo.jpg',
    });

    expect(result).toEqual(expect.objectContaining({ kind: 'file', contentType: 'application/pdf' }));
    const [key] = [...storage.objects.keys()];
    expect(key.endsWith('.pdf')).toBe(true);
  });

  it('rejects an SVG renamed to .pdf with ATTACHMENT_TYPE_UNSUPPORTED and writes nothing', async () => {
    const { service, storage, repository } = setup();

    await expectBadRequest(
      service.upload(CHURCH_A, STAFF_ID, { buffer: SVG_PAYLOAD, originalname: 'diagram.pdf' }),
      ATTACHMENT_ERROR_CODES.TYPE_UNSUPPORTED,
    );
    expect(storage.putPrivateObject).not.toHaveBeenCalled();
    expect(repository.insert).not.toHaveBeenCalled();
  });

  it('rejects a file named scan.png whose bytes are HTML with a PDF header buried after them', async () => {
    const { service, storage } = setup();
    // The header must be at byte 0. Content in front of it means the file is neither a PDF nor an image.
    await expectBadRequest(
      service.upload(CHURCH_A, STAFF_ID, {
        buffer: Buffer.concat([Buffer.from('<html>', 'ascii'), minimalPdf()]),
        originalname: 'scan.png',
      }),
      ATTACHMENT_ERROR_CODES.TYPE_UNSUPPORTED,
    );
    expect(storage.putPrivateObject).not.toHaveBeenCalled();
  });

  it('accepts an image of exactly 8 MB and rejects one byte more', async () => {
    const { service } = setup();

    await expect(
      service.upload(CHURCH_A, STAFF_ID, { buffer: jpegOfSize(ATTACHMENT_LIMITS.IMAGE_MAX_BYTES), originalname: 'a.jpg' }),
    ).resolves.toEqual(expect.objectContaining({ kind: 'image' }));

    await expectBadRequest(
      service.upload(CHURCH_A, STAFF_ID, { buffer: jpegOfSize(ATTACHMENT_LIMITS.IMAGE_MAX_BYTES + 1), originalname: 'b.jpg' }),
      ATTACHMENT_ERROR_CODES.TOO_LARGE,
    );
  });

  it('accepts a PDF of exactly 10 MB and rejects one byte more', async () => {
    const { service } = setup();

    await expect(
      service.upload(CHURCH_A, STAFF_ID, { buffer: pdfOfSize(10 * MB), originalname: 'a.pdf' }),
    ).resolves.toEqual(expect.objectContaining({ kind: 'file' }));

    await expectBadRequest(
      service.upload(CHURCH_A, STAFF_ID, { buffer: pdfOfSize(10 * MB + 1), originalname: 'b.pdf' }),
      ATTACHMENT_ERROR_CODES.TOO_LARGE,
    );
  });

  it('reports a missing or empty file as ATTACHMENT_MISSING_FILE', async () => {
    const { service } = setup();
    await expectBadRequest(service.upload(CHURCH_A, STAFF_ID, undefined), ATTACHMENT_ERROR_CODES.MISSING_FILE);
    await expectBadRequest(service.upload(CHURCH_A, STAFF_ID, { buffer: Buffer.alloc(0) }), ATTACHMENT_ERROR_CODES.MISSING_FILE);
  });

  it('rejects a malformed image with ATTACHMENT_IMAGE_INVALID before storing anything', async () => {
    const { service, storage } = setup();
    await expectBadRequest(
      service.upload(CHURCH_A, STAFF_ID, { buffer: truncatedJpeg(), originalname: 'broken.jpg' }),
      ATTACHMENT_ERROR_CODES.IMAGE_INVALID,
    );
    expect(storage.putPrivateObject).not.toHaveBeenCalled();
  });

  it('sanitises the stored original name', async () => {
    const { service, repository } = setup();
    const result = await service.upload(CHURCH_A, STAFF_ID, {
      buffer: minimalPdf(),
      originalname: `../../secret\u0000/${'x'.repeat(200)}.pdf`,
    });
    expect(result.name.length).toBe(120);
    expect(result.name).not.toMatch(/[/\\\u0000]/);
    expect(repository.rows[0].originalName).toBe(result.name);
  });

  it('maps a storage failure to a generic 503 that does not echo provider text', async () => {
    const { service, storage, repository } = setup();
    storage.putPrivateObject.mockRejectedValueOnce(
      Object.assign(new Error('AccessDenied: arn:aws:iam::123:role/x'), { name: 'AccessDenied' }),
    );

    const error = await service.upload(CHURCH_A, STAFF_ID, { buffer: minimalPdf() }).catch((e) => e);

    expect(error).toBeInstanceOf(ServiceUnavailableException);
    expect(JSON.stringify(error.getResponse())).not.toContain('AccessDenied');
    expect(JSON.stringify(error.getResponse())).not.toContain('arn:');
    expect(repository.insert).not.toHaveBeenCalled();
  });

  it('removes the stored object when the database insert fails', async () => {
    const { service, storage, repository } = setup();
    repository.insert.mockRejectedValueOnce(new Error('connection reset'));

    await expect(service.upload(CHURCH_A, STAFF_ID, { buffer: minimalPdf() })).rejects.toThrow('connection reset');

    const [key] = storage.putPrivateObject.mock.calls[0];
    expect(storage.deleteFromS3).toHaveBeenCalledWith(key);
    expect(storage.objects.has(key)).toBe(false);
  });
});

describe('AnnouncementAttachmentsService.getSignedUrl', () => {
  async function uploadPdf(service: AnnouncementAttachmentsService, churchId: string) {
    return (await service.upload(churchId, STAFF_ID, { buffer: minimalPdf(), originalname: 'a.pdf' })).id;
  }

  it('returns a 900-second signed URL to a member of the same church', async () => {
    const { service, storage } = setup();
    const id = await uploadPdf(service, CHURCH_A);

    const body = await service.getSignedUrl(CHURCH_A, id);

    expect(body.expiresIn).toBe(900);
    expect(body.url).toMatch(/^https:\/\//);
    const [key] = [...storage.objects.keys()];
    expect(storage.getSignedGetUrl).toHaveBeenCalledWith(key, 900);
    expect(Object.keys(body).sort()).toEqual(['expiresIn', 'url']);
    // The body carries no storage key as a field. The presigned URL necessarily contains the object path.
    expect(JSON.stringify({ expiresIn: body.expiresIn })).not.toContain(key);
  });

  it("returns 404 ATTACHMENT_NOT_FOUND for another church's attachment id", async () => {
    const { service, storage } = setup();
    const id = await uploadPdf(service, CHURCH_A);

    const error = await service.getSignedUrl(CHURCH_B, id).catch((e) => e);

    expect(error).toBeInstanceOf(NotFoundException);
    expect(error.getResponse()).toEqual(expect.objectContaining({ code: ATTACHMENT_ERROR_CODES.NOT_FOUND }));
    expect(storage.getSignedGetUrl).not.toHaveBeenCalled();
  });

  it('returns the same 404 for an unknown id and for a malformed id', async () => {
    const { service } = setup();
    for (const id of [randomUUID(), 'not-a-uuid', "1' OR '1'='1"]) {
      await expect(service.getSignedUrl(CHURCH_A, id)).rejects.toMatchObject({
        response: expect.objectContaining({ code: ATTACHMENT_ERROR_CODES.NOT_FOUND }),
      });
    }
  });

  it('maps a signing failure to a generic 503 without provider text', async () => {
    const { service, storage } = setup();
    const id = await uploadPdf(service, CHURCH_A);
    storage.getSignedGetUrl.mockRejectedValueOnce(new Error('SignatureDoesNotMatch secret-access-key'));

    const error = await service.getSignedUrl(CHURCH_A, id).catch((e) => e);

    expect(error).toBeInstanceOf(ServiceUnavailableException);
    expect(JSON.stringify(error.getResponse())).not.toContain('SignatureDoesNotMatch');
  });
});
