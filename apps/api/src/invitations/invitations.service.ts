import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  hashInvitationCode,
  generateInvitationCode,
  lastCharsOf,
  normalizeInvitationCode,
} from './invitation-code';
import {
  expiryDate,
  invitationStatus,
  InvitationStatus,
  isInvitationUsable,
  resolveExpiresInDays,
  resolveMaxUses,
} from './invitation-policy';
import {
  INVITATIONS_REPOSITORY,
  InvitationRecord,
  InvitationsRepository,
  MembershipRecord,
} from './invitations.repository';

export interface ActorContext {
  userId: string;
  churchId: string;
}

export interface CreateInvitationInput {
  maxUses?: unknown;
  expiresInDays?: unknown;
}

export interface CreatedInvitation {
  id: string;
  /** Plaintext code. Returned exactly once, at creation, and never stored. */
  code: string;
  maxUses: number;
  expiresAt: Date;
}

export interface InvitationAdminView {
  id: string;
  lastChars: string;
  maxUses: number;
  usedCount: number;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  status: InvitationStatus;
}

export interface JoinResult {
  status: 'pending_approval';
  churchName: string;
}

// The same body for unknown, expired, revoked and exhausted codes, so a probe cannot tell them apart.
function invalidCode(): NotFoundException {
  return new NotFoundException({ code: 'INVALID_CODE', message: 'This join code is not valid.' });
}

function alreadyMember(): ConflictException {
  return new ConflictException({
    code: 'ALREADY_MEMBER',
    message: 'You already belong to this church or have a request waiting for approval.',
  });
}

function invitationNotFound(): NotFoundException {
  return new NotFoundException({ code: 'INVITATION_NOT_FOUND', message: 'Invitation not found.' });
}

function membershipNotFound(): NotFoundException {
  return new NotFoundException({ code: 'MEMBERSHIP_NOT_FOUND', message: 'Membership request not found.' });
}

function membershipNotPending(): ConflictException {
  return new ConflictException({
    code: 'MEMBERSHIP_NOT_PENDING',
    message: 'This membership is not waiting for approval.',
  });
}

function toAdminView(invitation: InvitationRecord, now: Date): InvitationAdminView {
  return {
    id: invitation.id,
    lastChars: invitation.lastChars,
    maxUses: invitation.maxUses,
    usedCount: invitation.uses,
    expiresAt: invitation.expiresAt,
    revokedAt: invitation.revokedAt,
    createdAt: invitation.createdAt,
    status: invitationStatus(invitation, now),
  };
}

@Injectable()
export class InvitationsService {
  constructor(@Inject(INVITATIONS_REPOSITORY) private readonly repo: InvitationsRepository) {}

  async createInvitation(actor: ActorContext, input: CreateInvitationInput, now: Date): Promise<CreatedInvitation> {
    const maxUses = resolveMaxUses(input?.maxUses);
    const days = resolveExpiresInDays(input?.expiresInDays);
    const code = generateInvitationCode();
    const normalised = normalizeInvitationCode(code) as string;
    const expiresAt = expiryDate(now, days);

    const row = await this.repo.insertInvitation({
      churchId: actor.churchId,
      codeHash: hashInvitationCode(normalised),
      lastChars: lastCharsOf(normalised),
      expiresAt,
      maxUses,
      createdBy: actor.userId,
    });

    return { id: row.id, code, maxUses: row.maxUses, expiresAt: row.expiresAt };
  }

  async listInvitations(actor: ActorContext, now: Date): Promise<InvitationAdminView[]> {
    const rows = await this.repo.listInvitations(actor.churchId);
    return rows.map((row) => toAdminView(row, now));
  }

  async revokeInvitation(actor: ActorContext, invitationId: string, now: Date): Promise<void> {
    const row = await this.repo.revokeInvitation(actor.churchId, invitationId, now);
    if (!row) throw invitationNotFound();
  }

  /**
   * Consumes one use of a code and creates a pending_approval membership. Nothing grants
   * access until a branch admin approves it. The use and the membership commit together.
   */
  async join(userId: string, rawCode: unknown, now: Date): Promise<JoinResult> {
    const normalised = normalizeInvitationCode(rawCode);
    if (!normalised) throw invalidCode();
    const codeHash = hashInvitationCode(normalised);

    return this.repo.transaction(async (tx) => {
      const invitation = await tx.findInvitationByHash(codeHash);
      if (!invitation || !isInvitationUsable(invitation, now)) throw invalidCode();

      const existing = await tx.findLiveMembership(userId, invitation.churchId);
      if (existing) throw alreadyMember();

      const consumed = await tx.consumeInvitationUse(invitation.id, now);
      if (!consumed) throw invalidCode();

      const membership = await tx.insertPendingMembership(userId, invitation.churchId);
      if (!membership) throw alreadyMember();

      const churchName = (await tx.findChurchName(invitation.churchId)) ?? '';
      return { status: 'pending_approval', churchName };
    });
  }

  async listPendingMemberships(actor: ActorContext) {
    return this.repo.listPendingMemberships(actor.churchId);
  }

  /** Idempotent: approving an already active membership returns it unchanged. */
  async approveMembership(actor: ActorContext, membershipId: string, now: Date): Promise<{ id: string; status: 'active' }> {
    return this.repo.transaction(async (tx) => {
      const membership = await this.requireMembershipInChurch(tx, actor, membershipId);
      if (membership.status === 'active') return { id: membership.id, status: 'active' as const };
      if (membership.status !== 'pending_approval') throw membershipNotPending();

      await tx.setMembershipStatus(membership.id, 'active', now);
      return { id: membership.id, status: 'active' as const };
    });
  }

  /** Rejecting removes the pending row, so the person can request again later with a new use. */
  async rejectMembership(actor: ActorContext, membershipId: string, now: Date): Promise<{ id: string; status: 'rejected' }> {
    return this.repo.transaction(async (tx) => {
      const membership = await this.requireMembershipInChurch(tx, actor, membershipId);
      if (membership.status !== 'pending_approval') throw membershipNotPending();

      await tx.softDeleteMembership(membership.id, now);
      return { id: membership.id, status: 'rejected' as const };
    });
  }

  private async requireMembershipInChurch(
    tx: InvitationsRepository,
    actor: ActorContext,
    membershipId: string,
  ): Promise<MembershipRecord> {
    if (!actor.churchId) throw new ForbiddenException('Church context is required for this operation');
    const membership = await tx.findMembershipInChurch(actor.churchId, membershipId);
    if (!membership) throw membershipNotFound();
    return membership;
  }
}
