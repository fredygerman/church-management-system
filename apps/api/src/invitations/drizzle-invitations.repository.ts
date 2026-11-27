import { and, asc, desc, eq, gt, isNull, sql } from 'drizzle-orm';
import { churches, churchInvitations, db, userChurchMemberships, users } from '@church/db';
import {
  InvitationRecord,
  InvitationsRepository,
  MembershipRecord,
  MembershipStatus,
  NewInvitationRecord,
  PendingMembershipRecord,
} from './invitations.repository';

type Executor = typeof db;

function toInvitation(row: typeof churchInvitations.$inferSelect): InvitationRecord {
  return {
    id: row.id,
    churchId: row.churchId,
    codeHash: row.codeHash,
    lastChars: row.lastChars,
    expiresAt: row.expiresAt,
    maxUses: row.maxUses,
    uses: row.uses,
    revokedAt: row.revokedAt,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
  };
}

function toMembership(row: typeof userChurchMemberships.$inferSelect): MembershipRecord {
  return {
    id: row.id,
    userId: row.userId,
    churchId: row.churchId,
    status: row.status as MembershipStatus,
  };
}

/**
 * Production repository. Each method is scoped by church id or by a unique key.
 * Writes run through `executor`, which is either the shared db or a transaction.
 * Built by a factory in InvitationsModule (not DI-injected), because `db` is untyped.
 */
export class DrizzleInvitationsRepository implements InvitationsRepository {
  constructor(private readonly executor: Executor) {}

  transaction<T>(work: (tx: InvitationsRepository) => Promise<T>): Promise<T> {
    return this.executor.transaction((tx: Executor) => work(new DrizzleInvitationsRepository(tx)));
  }

  async insertInvitation(values: NewInvitationRecord): Promise<InvitationRecord> {
    const [row] = await this.executor
      .insert(churchInvitations)
      .values({
        churchId: values.churchId,
        codeHash: values.codeHash,
        lastChars: values.lastChars,
        expiresAt: values.expiresAt,
        maxUses: values.maxUses,
        createdBy: values.createdBy,
      })
      .returning();
    return toInvitation(row);
  }

  async listInvitations(churchId: string): Promise<InvitationRecord[]> {
    const rows = await this.executor
      .select()
      .from(churchInvitations)
      .where(eq(churchInvitations.churchId, churchId))
      .orderBy(desc(churchInvitations.createdAt));
    return rows.map(toInvitation);
  }

  async revokeInvitation(churchId: string, invitationId: string, now: Date): Promise<InvitationRecord | null> {
    const [updated] = await this.executor
      .update(churchInvitations)
      .set({ revokedAt: now })
      .where(
        and(
          eq(churchInvitations.id, invitationId),
          eq(churchInvitations.churchId, churchId),
          isNull(churchInvitations.revokedAt),
        ),
      )
      .returning();
    if (updated) return toInvitation(updated);

    // Already revoked (idempotent) or not in this church.
    const [existing] = await this.executor
      .select()
      .from(churchInvitations)
      .where(and(eq(churchInvitations.id, invitationId), eq(churchInvitations.churchId, churchId)))
      .limit(1);
    return existing ? toInvitation(existing) : null;
  }

  async findInvitationByHash(codeHash: string): Promise<InvitationRecord | null> {
    const [row] = await this.executor
      .select()
      .from(churchInvitations)
      .where(eq(churchInvitations.codeHash, codeHash))
      .limit(1);
    return row ? toInvitation(row) : null;
  }

  async consumeInvitationUse(invitationId: string, now: Date): Promise<InvitationRecord | null> {
    const [row] = await this.executor
      .update(churchInvitations)
      .set({ uses: sql`${churchInvitations.uses} + 1` })
      .where(
        and(
          eq(churchInvitations.id, invitationId),
          isNull(churchInvitations.revokedAt),
          gt(churchInvitations.expiresAt, now),
          sql`${churchInvitations.uses} < ${churchInvitations.maxUses}`,
        ),
      )
      .returning();
    return row ? toInvitation(row) : null;
  }

  async findLiveMembership(userId: string, churchId: string): Promise<MembershipRecord | null> {
    const [row] = await this.executor
      .select()
      .from(userChurchMemberships)
      .where(
        and(
          eq(userChurchMemberships.userId, userId),
          eq(userChurchMemberships.churchId, churchId),
          isNull(userChurchMemberships.deletedAt),
        ),
      )
      .limit(1);
    return row ? toMembership(row) : null;
  }

  async insertPendingMembership(userId: string, churchId: string): Promise<MembershipRecord | null> {
    // onConflictDoNothing keeps the surrounding transaction usable when a live row already exists.
    const [row] = await this.executor
      .insert(userChurchMemberships)
      .values({
        userId,
        churchId,
        role: 'member',
        status: 'pending_approval',
        isDefaultChurch: false,
      })
      .onConflictDoNothing()
      .returning();
    return row ? toMembership(row) : null;
  }

  async findChurchName(churchId: string): Promise<string | null> {
    const [row] = await this.executor
      .select({ name: churches.name })
      .from(churches)
      .where(eq(churches.id, churchId))
      .limit(1);
    return row?.name ?? null;
  }

  async listPendingMemberships(churchId: string): Promise<PendingMembershipRecord[]> {
    const rows = await this.executor
      .select({
        id: userChurchMemberships.id,
        userId: userChurchMemberships.userId,
        name: users.name,
        email: users.email,
        createdAt: userChurchMemberships.createdAt,
      })
      .from(userChurchMemberships)
      .innerJoin(users, eq(users.id, userChurchMemberships.userId))
      .where(
        and(
          eq(userChurchMemberships.churchId, churchId),
          eq(userChurchMemberships.status, 'pending_approval'),
          isNull(userChurchMemberships.deletedAt),
        ),
      )
      .orderBy(asc(userChurchMemberships.createdAt));
    return rows;
  }

  async findMembershipInChurch(churchId: string, membershipId: string): Promise<MembershipRecord | null> {
    const [row] = await this.executor
      .select()
      .from(userChurchMemberships)
      .where(
        and(
          eq(userChurchMemberships.id, membershipId),
          eq(userChurchMemberships.churchId, churchId),
          isNull(userChurchMemberships.deletedAt),
        ),
      )
      .limit(1);
    return row ? toMembership(row) : null;
  }

  async setMembershipStatus(membershipId: string, status: MembershipStatus, now: Date): Promise<void> {
    await this.executor
      .update(userChurchMemberships)
      .set({ status, updatedAt: now })
      .where(eq(userChurchMemberships.id, membershipId));
  }

  async softDeleteMembership(membershipId: string, now: Date): Promise<void> {
    await this.executor
      .update(userChurchMemberships)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(userChurchMemberships.id, membershipId));
  }
}
