import { isEditable, resolveTransition, type TransitionInput } from './announcement-state'

const AUTHOR = 'author-1'
const OTHER_ADMIN = 'admin-2'
const NOW = new Date('2026-12-01T06:00:00Z')
const LATER = new Date('2026-12-02T06:00:00Z')
const EARLIER = new Date('2026-11-30T06:00:00Z')

function input(overrides: Partial<TransitionInput>): TransitionInput {
  return {
    status: 'draft',
    action: 'publish',
    requireApproval: false,
    actorId: AUTHOR,
    actorRole: 'publisher',
    authorId: AUTHOR,
    alreadyApproved: false,
    pendingScheduled: false,
    pendingScheduledAt: null,
    now: NOW,
    ...overrides,
  }
}

describe('publish without approval (default, D-05)', () => {
  it('draft publish goes straight to published', () => {
    expect(resolveTransition(input({ status: 'draft', action: 'publish' }))).toEqual({
      ok: true,
      next: 'published',
      approves: false,
    })
  })

  it('draft schedule goes to scheduled', () => {
    expect(resolveTransition(input({ status: 'draft', action: 'schedule' }))).toMatchObject({ ok: true, next: 'scheduled' })
  })

  it('scheduled publish goes to published', () => {
    expect(resolveTransition(input({ status: 'scheduled', action: 'publish' }))).toMatchObject({ ok: true, next: 'published' })
  })

  it('scheduled reschedule stays scheduled', () => {
    expect(resolveTransition(input({ status: 'scheduled', action: 'schedule' }))).toMatchObject({ ok: true, next: 'scheduled' })
  })
})

describe('publish with approval on (D-05)', () => {
  const approvalOn = { requireApproval: true }

  it('the author\'s publish request moves a draft to pending_approval', () => {
    expect(resolveTransition(input({ ...approvalOn, status: 'draft', action: 'publish' }))).toEqual({
      ok: true,
      next: 'pending_approval',
      approves: false,
    })
  })

  it('the author\'s schedule request moves a draft to pending_approval', () => {
    expect(resolveTransition(input({ ...approvalOn, status: 'draft', action: 'schedule' }))).toMatchObject({
      ok: true,
      next: 'pending_approval',
    })
  })

  it('blocks self-approval with SELF_APPROVAL_FORBIDDEN (403)', () => {
    const outcome = resolveTransition(input({ ...approvalOn, status: 'pending_approval', actorId: AUTHOR, authorId: AUTHOR, actorRole: 'admin' }))
    expect(outcome).toMatchObject({ ok: false, httpStatus: 403, code: 'SELF_APPROVAL_FORBIDDEN' })
  })

  it('lets a different admin approve and publish', () => {
    expect(
      resolveTransition(input({ ...approvalOn, status: 'pending_approval', actorId: OTHER_ADMIN, actorRole: 'admin' })),
    ).toEqual({ ok: true, next: 'published', approves: true })
  })

  it('lets an approver confirm a future requested schedule', () => {
    expect(
      resolveTransition(
        input({
          ...approvalOn,
          status: 'pending_approval',
          actorId: OTHER_ADMIN,
          actorRole: 'admin',
          pendingScheduled: true,
          pendingScheduledAt: LATER,
        }),
      ),
    ).toEqual({ ok: true, next: 'scheduled', approves: true })
  })

  it('publishes a requested schedule whose time has already passed', () => {
    expect(
      resolveTransition(
        input({
          ...approvalOn,
          status: 'pending_approval',
          actorId: OTHER_ADMIN,
          actorRole: 'admin',
          pendingScheduled: true,
          pendingScheduledAt: EARLIER,
        }),
      ),
    ).toEqual({ ok: true, next: 'published', approves: true })
  })

  it('lets an approver with an explicit schedule action schedule the pending item', () => {
    expect(
      resolveTransition(input({ ...approvalOn, status: 'pending_approval', action: 'schedule', actorId: OTHER_ADMIN, actorRole: 'admin' })),
    ).toEqual({ ok: true, next: 'scheduled', approves: true })
  })

  it('refuses approval from a role without approve:announcements (publisher, branch admin)', () => {
    for (const role of ['publisher', 'branch_admin']) {
      expect(
        resolveTransition(input({ ...approvalOn, status: 'pending_approval', actorId: OTHER_ADMIN, actorRole: role })),
      ).toMatchObject({ ok: false, httpStatus: 403, code: 'APPROVAL_PERMISSION_REQUIRED' })
    }
  })

  it('publishing an already approved scheduled item skips a second approval', () => {
    expect(
      resolveTransition(input({ ...approvalOn, status: 'scheduled', action: 'publish', alreadyApproved: true })),
    ).toMatchObject({ ok: true, next: 'published' })
  })

  it('publishing a scheduled item that was never approved goes back through approval', () => {
    expect(
      resolveTransition(input({ ...approvalOn, status: 'scheduled', action: 'publish', alreadyApproved: false })),
    ).toMatchObject({ ok: true, next: 'pending_approval' })
  })

  it('rescheduling re-enters approval even when the item was approved before', () => {
    expect(
      resolveTransition(input({ ...approvalOn, status: 'scheduled', action: 'schedule', alreadyApproved: true })),
    ).toMatchObject({ ok: true, next: 'pending_approval' })
  })
})

describe('terminal and invalid transitions', () => {
  it.each([
    ['published', 'publish', 409, 'ALREADY_PUBLISHED'],
    ['published', 'schedule', 409, 'ALREADY_PUBLISHED'],
    ['cancelled', 'publish', 409, 'INVALID_STATE_TRANSITION'],
    ['cancelled', 'schedule', 409, 'INVALID_STATE_TRANSITION'],
    ['published', 'cancel', 409, 'INVALID_STATE_TRANSITION'],
    ['cancelled', 'cancel', 409, 'INVALID_STATE_TRANSITION'],
  ] as const)('%s + %s -> %s %s', (status, action, httpStatus, code) => {
    expect(resolveTransition(input({ status, action }))).toMatchObject({ ok: false, httpStatus, code })
  })
})

describe('cancel', () => {
  it.each(['draft', 'pending_approval', 'scheduled'] as const)('%s can be cancelled', (status) => {
    expect(resolveTransition(input({ status, action: 'cancel' }))).toEqual({ ok: true, next: 'cancelled', approves: false })
  })

  it('does not depend on the approval setting', () => {
    expect(resolveTransition(input({ status: 'pending_approval', action: 'cancel', requireApproval: true, actorId: OTHER_ADMIN }))).toMatchObject({
      ok: true,
      next: 'cancelled',
    })
  })
})

describe('editing', () => {
  it('only drafts are editable', () => {
    expect(isEditable('draft')).toBe(true)
    for (const status of ['pending_approval', 'scheduled', 'published', 'cancelled'] as const) {
      expect(isEditable(status)).toBe(false)
    }
  })
})
