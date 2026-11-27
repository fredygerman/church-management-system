import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import { AttachmentUploadInterceptor } from './attachment-upload.interceptor';

describe('AttachmentUploadInterceptor', () => {
  const context = {} as any;
  const next = { handle: jest.fn() } as any;

  function withUploadFailure(error: unknown) {
    const interceptor = new AttachmentUploadInterceptor();
    (interceptor as any).upload = { intercept: jest.fn().mockRejectedValue(error) };
    return interceptor;
  }

  it('reports a multipart size-limit breach as a 400 ATTACHMENT_TOO_LARGE, not a 413', async () => {
    const interceptor = withUploadFailure(new PayloadTooLargeException('File too large'));

    const error: any = await interceptor.intercept(context, next).catch((e) => e);

    expect(error).toBeInstanceOf(BadRequestException);
    expect(error.getResponse()).toEqual(expect.objectContaining({ code: 'ATTACHMENT_TOO_LARGE' }));
  });

  it('passes other upload errors through unchanged', async () => {
    const original = new BadRequestException('Unexpected field');
    const interceptor = withUploadFailure(original);

    await expect(interceptor.intercept(context, next)).rejects.toBe(original);
  });
});
