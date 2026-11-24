import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ChurchContextGuard } from './church-context.guard';

// No default church: the guard must fall through to the safe-endpoint list.
describe('ChurchContextGuard safe endpoints', () => {
  const guard = new ChurchContextGuard({ getAllAndOverride: () => false } as unknown as Reflector);

  const contextFor = (path: string, method: string): ExecutionContext => {
    const request = {
      user: { id: 'user-id', role: 'member', churchId: null },
      path,
      method,
      params: {},
      query: {},
      body: undefined,
    };
    return {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  };

  it('allows GET /auth/memberships without a church context', async () => {
    await expect(guard.canActivate(contextFor('/auth/memberships', 'GET'))).resolves.toBe(true);
  });

  it('still requires a church context for other endpoints', async () => {
    await expect(guard.canActivate(contextFor('/members', 'GET'))).rejects.toThrow(ForbiddenException);
  });
});
