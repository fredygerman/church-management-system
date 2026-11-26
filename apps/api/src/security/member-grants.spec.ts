/**
 * Regression guard for RM-001 (D-01): members must not hold visitor grants.
 * Visitor PII (name, phone, email) is staff-only; a member token must get 403
 * on /visitors and must not receive pendingVisitors on the dashboard.
 */
import { PERMISSION_MAP, UserRole, roleHasPermission } from '../auth/types/permission.types';

describe('MEMBER role grants (RM-001)', () => {
  const memberGrants: readonly string[] = PERMISSION_MAP[UserRole.MEMBER];

  it('does not grant view:visitors', () => {
    expect(memberGrants).not.toContain('view:visitors');
    expect(roleHasPermission(UserRole.MEMBER, 'view:visitors')).toBe(false);
  });

  it('does not grant create:visitor', () => {
    expect(memberGrants).not.toContain('create:visitor');
    expect(roleHasPermission(UserRole.MEMBER, 'create:visitor')).toBe(false);
  });

  it('keeps the self-service grants members rely on', () => {
    expect(roleHasPermission(UserRole.MEMBER, 'read:self')).toBe(true);
    expect(roleHasPermission(UserRole.MEMBER, 'view:events')).toBe(true);
    expect(roleHasPermission(UserRole.MEMBER, 'rsvp:event')).toBe(true);
  });

  it('keeps leader visitor access unchanged', () => {
    expect(roleHasPermission(UserRole.ZONE_LEADER, 'view:visitors')).toBe(true);
    expect(roleHasPermission(UserRole.DEPARTMENT_LEADER, 'create:visitor')).toBe(true);
  });
});
