/**
 * Persistence contract for invitations and pending memberships. The service depends
 * only on this interface; `DrizzleInvitationsRepository` is the production implementation.
 * Every church-scoped method takes the church id, so tenant filtering cannot be skipped.
 */

export const INVITATIONS_REPOSITORY = Symbol('INVITATIONS_REPOSITORY');

export type MembershipStatus = 'active' | 'invited' | 'suspended' | 'pending_approval';

export interface InvitationRecord {
  id: string;
  churchId: string;
  codeHash: string;
  lastChars: string;
  expiresAt: Date;
  maxUses: number;
  uses: number;
  revokedAt: Date | null;
  createdBy: string | null;
  createdAt: Date;
}

export interface NewInvitationRecord {
  churchId: string;
  codeHash: string;
  lastChars: string;
  expiresAt: Date;
  maxUses: number;
  createdBy: string;
}

export interface MembershipRecord {
  id: string;
  userId: string;
  churchId: string;
  status: MembershipStatus;
}

export interface PendingMembershipRecord {
  id: string;
  userId: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface InvitationsRepository {
  /** Runs `work` atomically. If it throws, every write made through `tx` is rolled back. */
  transaction<T>(work: (tx: InvitationsRepository) => Promise<T>): Promise<T>;

  insertInvitation(values: NewInvitationRecord): Promise<InvitationRecord>;

  listInvitations(churchId: string): Promise<InvitationRecord[]>;

  /** Sets revoked_at if not already set. Returns the row, or null when it is not in this church. */
  revokeInvitation(churchId: string, invitationId: string, now: Date): Promise<InvitationRecord | null>;

  findInvitationByHash(codeHash: string): Promise<InvitationRecord | null>;

  /**
   * Atomically increments uses only while the invitation is unrevoked, unexpired and below
   * max_uses. Returns the updated row, or null when no row qualified.
   */
  consumeInvitationUse(invitationId: string, now: Date): Promise<InvitationRecord | null>;

  /** Any non-deleted membership the user has in the church, whatever its status. */
  findLiveMembership(userId: string, churchId: string): Promise<MembershipRecord | null>;

  /** Inserts a pending_approval membership. Returns null when a live membership already exists. */
  insertPendingMembership(userId: string, churchId: string): Promise<MembershipRecord | null>;

  findChurchName(churchId: string): Promise<string | null>;

  listPendingMemberships(churchId: string): Promise<PendingMembershipRecord[]>;

  /** A non-deleted membership in this church, or null (including for other churches' rows). */
  findMembershipInChurch(churchId: string, membershipId: string): Promise<MembershipRecord | null>;

  setMembershipStatus(membershipId: string, status: MembershipStatus, now: Date): Promise<void>;

  softDeleteMembership(membershipId: string, now: Date): Promise<void>;
}
