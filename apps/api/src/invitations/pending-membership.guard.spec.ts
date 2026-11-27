import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ChurchContextGuard } from '../auth/guards/church-context.guard';

// The membership lookup returns whatever row each test sets here.
let mockMembershipRows: Array<Record<string, unknown>> = [];

jest.mock('@church/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => mockMembershipRows,
        }),
      }),
    }),
  },
  userChurchMemberships: {},
}));

const CHURCH = 'church-a';

function contextFor(user: Record<string, unknown>): { ctx: ExecutionContext; request: Record<string, any> } {
  const request: Record<string, any> = {
    user,
    path: '/churches/invitations',
    method: 'GET',
    params: {},
    query: {},
    body: undefined,
  };
  const ctx = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { ctx, request };
}

describe('ChurchContextGuard and pending_approval memberships', () => {
  const guard = new ChurchContextGuard({ getAllAndOverride: () => false } as unknown as Reflector);
  const originalAdmins = process.env.PLATFORM_ADMIN_USER_IDS;

  beforeEach(() => {
    process.env.PLATFORM_ADMIN_USER_IDS = '';
  });

  afterAll(() => {
    if (originalAdmins === undefined) delete process.env.PLATFORM_ADMIN_USER_IDS;
    else process.env.PLATFORM_ADMIN_USER_IDS = originalAdmins;
  });

  const membershipWith = (status: string) => [
    { id: 'mem-1', userId: 'user-1', churchId: CHURCH, role: 'member', assignedZoneId: null, status },
  ];

  it('gives a pending_approval membership no church access, even with the church as the active church', async () => {
    mockMembershipRows = membershipWith('pending_approval');
    const { ctx, request } = contextFor({ id: 'user-1', role: 'member', churchId: CHURCH });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    expect(request.churchId).toBeUndefined();
    expect(request.user.activeMembershipId).toBeUndefined();
  });

  it('still lets an active membership through (control for the test above)', async () => {
    mockMembershipRows = membershipWith('active');
    const { ctx, request } = contextFor({ id: 'user-1', role: 'member', churchId: CHURCH });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.user.activeMembershipId).toBe('mem-1');
  });

  it('blocks a suspended membership the same way', async () => {
    mockMembershipRows = membershipWith('suspended');
    const { ctx } = contextFor({ id: 'user-1', role: 'member', churchId: CHURCH });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });
});
