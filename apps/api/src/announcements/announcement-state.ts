import { HttpStatus } from '@nestjs/common'
import { roleHasPermission, UserRole } from '../auth/types/permission.types'
import type { AnnouncementErrorCode, AnnouncementStatus } from './announcements.types'

/**
 * Announcement state machine (pure, no I/O).
 *
 *   draft ──publish──▶ published                       (approval off)
 *   draft ──schedule─▶ scheduled                       (approval off)
 *   draft ──publish/schedule──▶ pending_approval       (approval on; author's request)
 *   pending_approval ──publish/schedule by approver──▶ published | scheduled
 *   scheduled ──publish──▶ published                   (already approved, or approval off)
 *   scheduled ──schedule──▶ scheduled | pending_approval
 *   draft | pending_approval | scheduled ──cancel──▶ cancelled
 *
 * Published and cancelled are terminal for these actions. Editing is a separate rule (draft only).
 */

export type AnnouncementAction = 'publish' | 'schedule' | 'cancel'

export interface TransitionInput {
  status: AnnouncementStatus
  action: AnnouncementAction
  /** Current church setting announcements.requireApproval. */
  requireApproval: boolean
  actorId: string
  actorRole: string
  authorId: string | null
  /** True when a row already carries an approval (approved_by set). */
  alreadyApproved: boolean
  /** True when a pending row was requested as a schedule (scheduled_at set). */
  pendingScheduled: boolean
  /** Scheduled time from the pending request, if any. */
  pendingScheduledAt: Date | null
  now: Date
}

export type TransitionOutcome =
  | { ok: true; next: AnnouncementStatus; approves: boolean }
  | { ok: false; httpStatus: number; code: AnnouncementErrorCode; message: string }

export function resolveTransition(input: TransitionInput): TransitionOutcome {
  const { status, action } = input

  if (action === 'cancel') {
    if (status === 'draft' || status === 'pending_approval' || status === 'scheduled') {
      return ok('cancelled', false)
    }
    return fail(HttpStatus.CONFLICT, 'INVALID_STATE_TRANSITION', `A ${status} announcement cannot be cancelled`)
  }

  if (status === 'cancelled') {
    return fail(HttpStatus.CONFLICT, 'INVALID_STATE_TRANSITION', 'A cancelled announcement cannot be published or scheduled')
  }
  if (status === 'published') {
    return fail(HttpStatus.CONFLICT, 'ALREADY_PUBLISHED', 'This announcement has already been published')
  }

  if (status === 'pending_approval') {
    if (input.authorId !== null && input.authorId === input.actorId) {
      return fail(HttpStatus.FORBIDDEN, 'SELF_APPROVAL_FORBIDDEN', 'The author cannot approve their own announcement')
    }
    if (!roleHasPermission(input.actorRole as UserRole, 'approve:announcements')) {
      return fail(HttpStatus.FORBIDDEN, 'APPROVAL_PERMISSION_REQUIRED', 'Approving an announcement requires approve:announcements')
    }
    // The approver confirms what was requested. A requested schedule still in the future stays scheduled;
    // a past or missing time publishes now. An explicit schedule action always schedules.
    const keepScheduled =
      action === 'schedule' ||
      (input.pendingScheduled && input.pendingScheduledAt !== null && input.pendingScheduledAt.getTime() > input.now.getTime())
    return ok(keepScheduled ? 'scheduled' : 'published', true)
  }

  // draft or scheduled. Publishing an already approved schedule goes straight through; anything else
  // goes through approval when the church requires it.
  const skipsApproval = action === 'publish' && input.alreadyApproved
  if (input.requireApproval && !skipsApproval) {
    return ok('pending_approval', false)
  }
  return ok(action === 'schedule' ? 'scheduled' : 'published', false)
}

/** A scheduled row is due once its time has passed. Only the scheduler pass uses this. */
export function isScheduleDue(status: AnnouncementStatus, scheduledAt: Date | null, now: Date): boolean {
  return status === 'scheduled' && scheduledAt !== null && scheduledAt.getTime() <= now.getTime()
}

/** Editing is allowed only for drafts. */
export function isEditable(status: AnnouncementStatus): boolean {
  return status === 'draft'
}

function ok(next: AnnouncementStatus, approves: boolean): TransitionOutcome {
  return { ok: true, next, approves }
}

function fail(httpStatus: number, code: AnnouncementErrorCode, message: string): TransitionOutcome {
  return { ok: false, httpStatus, code, message }
}
