import { REQUIRED_PERMISSION_KEY } from '../auth/guards/permission.guard';
import { JOIN_THROTTLE, InvitationsController } from './invitations.controller';
import { JoinThrottlerGuard } from './join-throttler.guard';
import { SKIP_CHURCH_CONTEXT_KEY } from './skip-church-context.decorator';

jest.mock('@church/db', () => ({ db: {} }));

const proto = InvitationsController.prototype as unknown as Record<string, (...args: unknown[]) => unknown>;

const ADMIN_HANDLERS = [
  'createInvitation',
  'listInvitations',
  'revokeInvitation',
  'listPendingMemberships',
  'approveMembership',
  'rejectMembership',
] as const;

describe('InvitationsController route metadata', () => {
  it.each(ADMIN_HANDLERS)('%s requires manage:invitations', (handler) => {
    expect(Reflect.getMetadata(REQUIRED_PERMISSION_KEY, proto[handler])).toEqual(['manage:invitations']);
  });

  it('join requires no permission but skips the church-context guard', () => {
    expect(Reflect.getMetadata(REQUIRED_PERMISSION_KEY, proto.join)).toBeUndefined();
    expect(Reflect.getMetadata(SKIP_CHURCH_CONTEXT_KEY, proto.join)).toBe(true);
  });

  it('only the join route skips the church-context guard', () => {
    for (const handler of ADMIN_HANDLERS) {
      expect(Reflect.getMetadata(SKIP_CHURCH_CONTEXT_KEY, proto[handler])).toBeUndefined();
    }
  });

  it('throttles join to 5 attempts per minute', () => {
    expect(JOIN_THROTTLE).toEqual({ default: { limit: 5, ttl: 60_000 } });
    // Metadata keys used by @nestjs/throttler's @Throttle decorator.
    expect(Reflect.getMetadata('THROTTLER:LIMITdefault', proto.join)).toBe(5);
    expect(Reflect.getMetadata('THROTTLER:TTLdefault', proto.join)).toBe(60_000);
  });
});

describe('JoinThrottlerGuard tracker', () => {
  // getTracker is protected; call it on the prototype with a plain request object.
  const trackerFor = (req: Record<string, unknown>) =>
    (JoinThrottlerGuard.prototype as unknown as { getTracker: (r: unknown) => Promise<string> }).getTracker(req);

  it('keys by user, so rotating IP addresses does not reset the count', async () => {
    const fromOneIp = await trackerFor({ user: { id: 'user-1' }, ip: '10.0.0.1' });
    const fromAnotherIp = await trackerFor({ user: { id: 'user-1' }, ip: '10.0.0.2' });
    expect(fromOneIp).toBe(fromAnotherIp);
    expect(fromOneIp).toBe('join-user:user-1');
  });

  it('keeps different users apart', async () => {
    expect(await trackerFor({ user: { id: 'user-1' }, ip: '10.0.0.1' })).not.toBe(
      await trackerFor({ user: { id: 'user-2' }, ip: '10.0.0.1' }),
    );
  });

  it('falls back to IP only when no user is attached', async () => {
    expect(await trackerFor({ ip: '10.0.0.9' })).toBe('join-user:10.0.0.9');
  });
});
