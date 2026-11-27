import { UnprocessableEntityException } from '@nestjs/common';
import { InvitationsService, ActorContext } from './invitations.service';
import { hashInvitationCode } from './invitation-code';
import {
  InvitationRecord,
  InvitationsRepository,
  MembershipRecord,
  MembershipStatus,
  NewInvitationRecord,
  PendingMembershipRecord,
} from './invitations.repository';

const KEY = 'test-invitation-hmac-key-0123456789abcdef';
const NOW = new Date('2026-11-27T10:00:00Z');
const DAY = 86_400_000;
const CHURCH_A = 'church-a';
const CHURCH_B = 'church-b';
const ADMIN_A: ActorContext = { userId: 'admin-a', churchId: CHURCH_A };
const ADMIN_B: ActorContext = { userId: 'admin-b', churchId: CHURCH_B };

interface StoredMembership extends MembershipRecord {
  deleted: boolean;
  createdAt: Date;
}

/** In-memory repository. transaction() restores the snapshot on throw, like a real rollback. */
class FakeRepo implements InvitationsRepository {
  invitations: InvitationRecord[] = [];
  memberships: StoredMembership[] = [];
  users = new Map([
    ['user-1', { name: 'Asha Member', email: 'asha@example.org' }],
    ['user-2', { name: 'Brian Member', email: 'brian@example.org' }],
    ['user-3', { name: 'Chao Member', email: 'chao@example.org' }],
  ]);
  churchNames = new Map([
    [CHURCH_A, 'Mito ya Baraka HQ'],
    [CHURCH_B, 'Second Church'],
  ]);
  /** Simulates a concurrent insert that wins the unique (user, church) race. */
  forceMembershipConflict = false;
  private seq = 0;

  async transaction<T>(work: (tx: InvitationsRepository) => Promise<T>): Promise<T> {
    const snapshot = {
      invitations: this.invitations.map((row) => ({ ...row })),
      memberships: this.memberships.map((row) => ({ ...row })),
    };
    try {
      return await work(this);
    } catch (error) {
      this.invitations = snapshot.invitations;
      this.memberships = snapshot.memberships;
      throw error;
    }
  }

  async insertInvitation(values: NewInvitationRecord): Promise<InvitationRecord> {
    const row: InvitationRecord = {
      id: `inv-${++this.seq}`,
      churchId: values.churchId,
      codeHash: values.codeHash,
      lastChars: values.lastChars,
      expiresAt: values.expiresAt,
      maxUses: values.maxUses,
      uses: 0,
      revokedAt: null,
      createdBy: values.createdBy,
      createdAt: NOW,
    };
    this.invitations.push(row);
    return { ...row };
  }

  async listInvitations(churchId: string) {
    return this.invitations.filter((row) => row.churchId === churchId).map((row) => ({ ...row }));
  }

  async revokeInvitation(churchId: string, invitationId: string, now: Date) {
    const row = this.invitations.find((item) => item.id === invitationId && item.churchId === churchId);
    if (!row) return null;
    if (row.revokedAt === null) row.revokedAt = now;
    return { ...row };
  }

  async findInvitationByHash(codeHash: string) {
    const row = this.invitations.find((item) => item.codeHash === codeHash);
    return row ? { ...row } : null;
  }

  async consumeInvitationUse(invitationId: string, now: Date) {
    const row = this.invitations.find((item) => item.id === invitationId);
    if (!row || row.revokedAt !== null || row.expiresAt.getTime() <= now.getTime() || row.uses >= row.maxUses) {
      return null;
    }
    row.uses += 1;
    return { ...row };
  }

  async findLiveMembership(userId: string, churchId: string) {
    const row = this.memberships.find((m) => !m.deleted && m.userId === userId && m.churchId === churchId);
    return row ? { id: row.id, userId: row.userId, churchId: row.churchId, status: row.status } : null;
  }

  async insertPendingMembership(userId: string, churchId: string) {
    const existing = await this.findLiveMembership(userId, churchId);
    if (existing || this.forceMembershipConflict) return null;
    const row: StoredMembership = {
      id: `mem-${++this.seq}`,
      userId,
      churchId,
      status: 'pending_approval',
      deleted: false,
      createdAt: NOW,
    };
    this.memberships.push(row);
    return { id: row.id, userId, churchId, status: row.status };
  }

  async findChurchName(churchId: string) {
    return this.churchNames.get(churchId) ?? null;
  }

  async listPendingMemberships(churchId: string): Promise<PendingMembershipRecord[]> {
    return this.memberships
      .filter((m) => !m.deleted && m.churchId === churchId && m.status === 'pending_approval')
      .map((m) => ({ id: m.id, userId: m.userId, ...this.users.get(m.userId)!, createdAt: m.createdAt }));
  }

  async findMembershipInChurch(churchId: string, membershipId: string) {
    const row = this.memberships.find((m) => !m.deleted && m.id === membershipId && m.churchId === churchId);
    return row ? { id: row.id, userId: row.userId, churchId: row.churchId, status: row.status } : null;
  }

  async setMembershipStatus(membershipId: string, status: MembershipStatus) {
    const row = this.memberships.find((m) => m.id === membershipId)!;
    row.status = status;
  }

  async softDeleteMembership(membershipId: string) {
    const row = this.memberships.find((m) => m.id === membershipId)!;
    row.deleted = true;
  }

  membershipStatus(id: string): MembershipStatus | 'deleted' {
    const row = this.memberships.find((m) => m.id === id)!;
    return row.deleted ? 'deleted' : row.status;
  }
}

async function errorOf(promise: Promise<unknown>): Promise<{ status: number; body: any }> {
  try {
    await promise;
  } catch (error: any) {
    return { status: error.getStatus(), body: error.getResponse() };
  }
  throw new Error('expected the promise to reject');
}

describe('InvitationsService', () => {
  let repo: FakeRepo;
  let service: InvitationsService;
  const originalKey = process.env.INVITATION_CODE_HMAC_KEY;

  beforeEach(() => {
    process.env.INVITATION_CODE_HMAC_KEY = KEY;
    repo = new FakeRepo();
    service = new InvitationsService(repo);
  });

  afterAll(() => {
    if (originalKey === undefined) delete process.env.INVITATION_CODE_HMAC_KEY;
    else process.env.INVITATION_CODE_HMAC_KEY = originalKey;
  });

  /** Creates a code in church A and returns the plaintext shown once. */
  async function createCode(options: { maxUses?: number; expiresInDays?: number } = {}) {
    return service.createInvitation(ADMIN_A, options, NOW);
  }

  describe('code creation', () => {
    it('returns the plaintext code once and stores only its HMAC', async () => {
      const created = await createCode({ maxUses: 5, expiresInDays: 7 });

      expect(created.code).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/);
      expect(created.maxUses).toBe(5);
      expect(created.expiresAt.getTime()).toBe(NOW.getTime() + 7 * DAY);

      const stored = repo.invitations[0];
      expect(stored.codeHash).toBe(hashInvitationCode(created.code.replace('-', '')));
      expect(JSON.stringify(repo.invitations)).not.toContain(created.code.replace('-', ''));
      expect(JSON.stringify(repo.invitations)).not.toContain(created.code);
      expect(stored.lastChars).toBe(created.code.slice(-4));
    });

    it('never includes the code or hash in the admin list', async () => {
      const created = await createCode();
      const [view] = await service.listInvitations(ADMIN_A, NOW);

      expect(view).not.toHaveProperty('code');
      expect(view).not.toHaveProperty('codeHash');
      expect(JSON.stringify(view)).not.toContain(created.code);
      expect(view).toMatchObject({ lastChars: created.code.slice(-4), usedCount: 0, maxUses: 50, status: 'active' });
    });

    it('defaults to 50 max uses and 14 days of expiry', async () => {
      const created = await createCode();
      expect(created.maxUses).toBe(50);
      expect(created.expiresAt.getTime()).toBe(NOW.getTime() + 14 * DAY);
    });

    it('rejects out-of-range max uses and expiry before writing', async () => {
      await expect(createCode({ maxUses: 0 })).rejects.toThrow(UnprocessableEntityException);
      await expect(createCode({ maxUses: 501 })).rejects.toThrow(UnprocessableEntityException);
      await expect(createCode({ expiresInDays: 91 })).rejects.toThrow(UnprocessableEntityException);
      expect(repo.invitations).toHaveLength(0);
    });
  });

  describe('join', () => {
    it('creates a pending_approval membership and never an active one', async () => {
      const { code } = await createCode();

      const result = await service.join('user-1', code, NOW);

      expect(result).toEqual({ status: 'pending_approval', churchName: 'Mito ya Baraka HQ' });
      expect(repo.memberships).toHaveLength(1);
      expect(repo.memberships[0]).toMatchObject({ userId: 'user-1', churchId: CHURCH_A, status: 'pending_approval' });
      expect(repo.invitations[0].uses).toBe(1);
    });

    it('accepts lowercase input without dashes', async () => {
      const { code } = await createCode();
      const result = await service.join('user-1', code.replace('-', '').toLowerCase(), NOW);
      expect(result.status).toBe('pending_approval');
    });

    it('returns the same INVALID_CODE body for unknown, malformed, expired and revoked codes', async () => {
      const expired = await createCode({ expiresInDays: 1 });
      const revoked = await createCode();
      await service.revokeInvitation(ADMIN_A, repo.invitations[1].id, NOW);

      const unknown = await errorOf(service.join('user-1', 'ZZZZ-ZZZZ', NOW));
      const malformed = await errorOf(service.join('user-1', 'nope', NOW));
      const afterExpiry = await errorOf(service.join('user-1', expired.code, new Date(NOW.getTime() + 2 * DAY)));
      const afterRevoke = await errorOf(service.join('user-1', revoked.code, NOW));

      for (const failure of [unknown, malformed, afterExpiry, afterRevoke]) {
        expect(failure.status).toBe(404);
        expect(failure.body).toEqual({ code: 'INVALID_CODE', message: 'This join code is not valid.' });
      }
      expect(repo.memberships).toHaveLength(0);
    });

    it('treats the expiry instant itself as expired', async () => {
      const { code } = await createCode({ expiresInDays: 1 });
      const at = new Date(NOW.getTime() + DAY);
      await expect(errorOf(service.join('user-1', code, at))).resolves.toMatchObject({ status: 404 });
    });

    it('stops at max uses: the next join gets the same 404 INVALID_CODE', async () => {
      const { code } = await createCode({ maxUses: 2 });

      await service.join('user-1', code, NOW);
      await service.join('user-2', code, NOW);
      const third = await errorOf(service.join('user-3', code, NOW));

      expect(third.status).toBe(404);
      expect(third.body.code).toBe('INVALID_CODE');
      expect(repo.invitations[0].uses).toBe(2);
      const [view] = await service.listInvitations(ADMIN_A, NOW);
      expect(view).toMatchObject({ usedCount: 2, status: 'exhausted' });
    });

    it('rejects an already-active member with 409 and does not consume a use', async () => {
      const { code } = await createCode();
      repo.memberships.push({
        id: 'mem-active',
        userId: 'user-1',
        churchId: CHURCH_A,
        status: 'active',
        deleted: false,
        createdAt: NOW,
      });

      const failure = await errorOf(service.join('user-1', code, NOW));

      expect(failure.status).toBe(409);
      expect(failure.body.code).toBe('ALREADY_MEMBER');
      expect(repo.invitations[0].uses).toBe(0);
    });

    it('rejects a user who already has a pending request with 409 and does not consume a use', async () => {
      const { code } = await createCode();
      await service.join('user-1', code, NOW);

      const failure = await errorOf(service.join('user-1', code, NOW));

      expect(failure.status).toBe(409);
      expect(failure.body.code).toBe('ALREADY_MEMBER');
      expect(repo.invitations[0].uses).toBe(1);
    });

    it('rolls back the use when the membership insert loses a race', async () => {
      const { code } = await createCode();
      repo.forceMembershipConflict = true;

      const failure = await errorOf(service.join('user-1', code, NOW));

      expect(failure).toMatchObject({ status: 409 });
      expect(failure.body.code).toBe('ALREADY_MEMBER');
      expect(repo.invitations[0].uses).toBe(0);
      expect(repo.memberships).toHaveLength(0);
    });

    it('lets a person rejoin after a rejection, using a fresh use', async () => {
      const { code } = await createCode({ maxUses: 5 });
      await service.join('user-1', code, NOW);
      const [membership] = repo.memberships;
      await service.rejectMembership(ADMIN_A, membership.id, NOW);

      const again = await service.join('user-1', code, NOW);

      expect(again.status).toBe('pending_approval');
      expect(repo.invitations[0].uses).toBe(2);
    });
  });

  describe('revoke', () => {
    it('revokes a code so it stops working and is shown as revoked', async () => {
      const { code } = await createCode();
      await service.revokeInvitation(ADMIN_A, repo.invitations[0].id, NOW);

      await expect(errorOf(service.join('user-1', code, NOW))).resolves.toMatchObject({ status: 404 });
      const [view] = await service.listInvitations(ADMIN_A, NOW);
      expect(view.status).toBe('revoked');
    });

    it('is idempotent', async () => {
      await createCode();
      const id = repo.invitations[0].id;
      await service.revokeInvitation(ADMIN_A, id, NOW);
      await expect(service.revokeInvitation(ADMIN_A, id, new Date(NOW.getTime() + 1000))).resolves.toBeUndefined();
      expect(repo.invitations[0].revokedAt).toEqual(NOW);
    });

    it('cannot revoke another church\'s invitation (404, nothing changed)', async () => {
      await createCode();
      const id = repo.invitations[0].id;

      const failure = await errorOf(service.revokeInvitation(ADMIN_B, id, NOW));

      expect(failure).toMatchObject({ status: 404 });
      expect(failure.body.code).toBe('INVITATION_NOT_FOUND');
      expect(repo.invitations[0].revokedAt).toBeNull();
    });
  });

  describe('tenant isolation', () => {
    it('lists only the caller\'s own church invitations', async () => {
      await createCode();
      await service.createInvitation(ADMIN_B, {}, NOW);

      const listedA = await service.listInvitations(ADMIN_A, NOW);
      const listedB = await service.listInvitations(ADMIN_B, NOW);

      expect(listedA).toHaveLength(1);
      expect(listedB).toHaveLength(1);
      expect(listedA[0].id).not.toBe(listedB[0].id);
    });
  });

  describe('pending memberships and approval', () => {
    async function pendingFor(userId: string) {
      const { code } = await createCode();
      await service.join(userId, code, NOW);
      return repo.memberships.find((m) => m.userId === userId)!;
    }

    it('lists only pending memberships for the caller\'s church', async () => {
      const membership = await pendingFor('user-1');
      repo.memberships.push({
        id: 'mem-active',
        userId: 'user-2',
        churchId: CHURCH_A,
        status: 'active',
        deleted: false,
        createdAt: NOW,
      });
      repo.memberships.push({
        id: 'mem-b',
        userId: 'user-3',
        churchId: CHURCH_B,
        status: 'pending_approval',
        deleted: false,
        createdAt: NOW,
      });

      const list = await service.listPendingMemberships(ADMIN_A);

      expect(list.map((row) => row.id)).toEqual([membership.id]);
      expect(list[0]).toMatchObject({ name: 'Asha Member', email: 'asha@example.org' });
    });

    it('approves a pending membership to active', async () => {
      const membership = await pendingFor('user-1');

      await expect(service.approveMembership(ADMIN_A, membership.id, NOW)).resolves.toEqual({
        id: membership.id,
        status: 'active',
      });
      expect(repo.membershipStatus(membership.id)).toBe('active');
    });

    it('is idempotent when approving twice', async () => {
      const membership = await pendingFor('user-1');
      await service.approveMembership(ADMIN_A, membership.id, NOW);

      await expect(service.approveMembership(ADMIN_A, membership.id, NOW)).resolves.toEqual({
        id: membership.id,
        status: 'active',
      });
      expect(repo.membershipStatus(membership.id)).toBe('active');
    });

    it('cannot approve another church\'s membership (404, status unchanged)', async () => {
      const membership = await pendingFor('user-1');

      const failure = await errorOf(service.approveMembership(ADMIN_B, membership.id, NOW));

      expect(failure).toMatchObject({ status: 404 });
      expect(failure.body.code).toBe('MEMBERSHIP_NOT_FOUND');
      expect(repo.membershipStatus(membership.id)).toBe('pending_approval');
    });

    it('cannot reject another church\'s membership (404, status unchanged)', async () => {
      const membership = await pendingFor('user-1');

      await expect(errorOf(service.rejectMembership(ADMIN_B, membership.id, NOW))).resolves.toMatchObject({
        status: 404,
      });
      expect(repo.membershipStatus(membership.id)).toBe('pending_approval');
    });

    it('rejects by removing the pending row, so it leaves the queue', async () => {
      const membership = await pendingFor('user-1');

      await service.rejectMembership(ADMIN_A, membership.id, NOW);

      expect(repo.membershipStatus(membership.id)).toBe('deleted');
      await expect(service.listPendingMemberships(ADMIN_A)).resolves.toEqual([]);
    });

    it('does not let a rejected or missing membership be approved', async () => {
      const membership = await pendingFor('user-1');
      await service.rejectMembership(ADMIN_A, membership.id, NOW);

      await expect(errorOf(service.approveMembership(ADMIN_A, membership.id, NOW))).resolves.toMatchObject({
        status: 404,
      });
    });

    it('refuses to reject a membership that is already active', async () => {
      const membership = await pendingFor('user-1');
      await service.approveMembership(ADMIN_A, membership.id, NOW);

      const failure = await errorOf(service.rejectMembership(ADMIN_A, membership.id, NOW));

      expect(failure.status).toBe(409);
      expect(failure.body.code).toBe('MEMBERSHIP_NOT_PENDING');
      expect(repo.membershipStatus(membership.id)).toBe('active');
    });

    it('approval grants church access only after the decision, not on join', async () => {
      const { code } = await createCode();
      await service.join('user-1', code, NOW);
      expect(repo.memberships[0].status).toBe('pending_approval');

      await service.approveMembership(ADMIN_A, repo.memberships[0].id, NOW);
      expect(repo.memberships[0].status).toBe('active');
    });
  });
});
