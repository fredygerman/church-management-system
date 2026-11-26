import { BadRequestException, ConflictException, ExecutionContext, Logger } from '@nestjs/common';
import { lastValueFrom, throwError, Observable } from 'rxjs';
import { ErrorInterceptor } from './error.interceptor';

function makeContext(headers: Record<string, string> = {}) {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const request = { method: 'GET', url: '/things', headers };
  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({ status }),
    }),
  } as unknown as ExecutionContext;
  return { context, json, status };
}

async function run(error: unknown, headers?: Record<string, string>) {
  const interceptor = new ErrorInterceptor();
  const { context, json, status } = makeContext(headers);
  const next = { handle: () => throwError(() => error) as Observable<any> };
  await lastValueFrom(interceptor.intercept(context, next as any), { defaultValue: undefined });
  return { json, status };
}

describe('ErrorInterceptor (RM-009)', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns a generic message for a plain Error and never echoes its text or name', async () => {
    const { json, status } = await run(new Error('secret detail: db password=abc'));

    expect(status).toHaveBeenCalledWith(500);
    const body = json.mock.calls[0][0];
    expect(body.message).toBe('Internal server error');
    expect(body.code).toBe('INTERNAL_SERVER_ERROR');
    expect(body.error).toBeNull();
    expect(JSON.stringify(body)).not.toContain('secret detail');
    expect(JSON.stringify(body)).not.toContain('Error:');
    expect(body.requestId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('logs the original error server-side with the same requestId', async () => {
    const logSpy = Logger.prototype.error as jest.Mock;
    const { json } = await run(new Error('secret detail'), { 'x-request-id': 'req-123' });

    expect(json.mock.calls[0][0].requestId).toBe('req-123');
    expect(logSpy.mock.calls[0][0]).toContain('req-123');
    expect(logSpy.mock.calls[0][1]).toContain('secret detail');
  });

  it('ignores an unsafe x-request-id and generates its own', async () => {
    const { json } = await run(new Error('boom'), { 'x-request-id': 'bad id\n<script>' });

    expect(json.mock.calls[0][0].requestId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('keeps the intentional message of an HttpException and uses its code', async () => {
    const { json, status } = await run(
      new BadRequestException({
        message: 'Email change requires verification',
        code: 'EMAIL_CHANGE_REQUIRES_VERIFICATION',
      }),
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json.mock.calls[0][0]).toMatchObject({
      success: false,
      statusCode: 400,
      message: 'Email change requires verification',
      code: 'EMAIL_CHANGE_REQUIRES_VERIFICATION',
    });
  });

  it('derives HTTP_<status> when an HttpException carries no code', async () => {
    const { json } = await run(new ConflictException('Already exists'));

    expect(json.mock.calls[0][0]).toMatchObject({
      statusCode: 409,
      message: 'Already exists',
      code: 'HTTP_409',
    });
  });
});
