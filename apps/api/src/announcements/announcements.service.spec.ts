import { AnnouncementsService, type AnnouncementActor } from './announcements.service'
import type {
  AnnouncementPatch,
  AnnouncementRepository,
  AnnouncementRow,
  AnnouncementStatus,
  NewAnnouncementRow,
  PageQuery,
  ViewerProfile,
} from './announcements.types'
import type { CreateAnnouncementDto, ScheduleAnnouncementDto, UpdateAnnouncementDto } from './dto/announcement.dto'

const CHURCH_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const CHURCH_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const ZONE_1 = '11111111-1111-4111-8111-111111111111'
const ZONE_2 = '22222222-2222-4222-8222-222222222222'
const UNKNOWN_ID = '99999999-9999-4999-8999-999999999999'

const admin: AnnouncementActor = { churchId: CHURCH_A, userId: 'admin-a', role: 'admin' }
const secondAdmin: AnnouncementActor = { churchId: CHURCH_A, userId: 'admin-a2', role: 'admin' }
const publisher: AnnouncementActor = { churchId: CHURCH_A, userId: 'publisher-a', role: 'publisher' }
const memberFemale: AnnouncementActor = { churchId: CHURCH_A, userId: 'member-f', role: 'member' }
const memberMale: AnnouncementActor = { churchId: CHURCH_A, userId: 'member-m', role: 'member' }
const accountOnly: AnnouncementActor = { churchId: CHURCH_A, userId: 'account-only', role: 'member' }
const adminB: AnnouncementActor = { churchId: CHURCH_B, userId: 'admin-b', role: 'admin' }
const memberB: AnnouncementActor = { churchId: CHURCH_B, userId: 'member-b', role: 'member' }

const VALID_BODY = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Karibuni wote' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Join us at ' }, { type: 'text', text: '6 pm', marks: [{ type: 'bold' }] }] },
  ],
}

class InMemoryAnnouncementRepository implements AnnouncementRepository {
  readonly rows = new Map<string, AnnouncementRow>()
  readonly viewers = new Map<string, ViewerProfile & { churchId: string }>()
  readonly approvalSettings = new Map<string, boolean>()
  private seq = 0

  async insert(row: NewAnnouncementRow): Promise<AnnouncementRow> {
    this.seq += 1
    const createdAt = new Date(Date.UTC(2026, 0, 1) + this.seq * 1000)
    const stored: AnnouncementRow = {
      id: `00000000-0000-4000-8000-${String(this.seq).padStart(12, '0')}`,
      churchId: row.churchId,
      title: row.title,
      summary: row.summary,
      bodyFormat: row.bodyFormat,
      body: row.body,
      channels: row.channels,
      audience: row.audience,
      smsBody: row.smsBody,
      status: row.status,
      publishIdempotencyKey: null,
      createdBy: row.createdBy,
      approvedBy: null,
      approvedAt: null,
      scheduledAt: row.scheduledAt,
      publishedAt: null,
      cancelledAt: null,
      expiresAt: row.expiresAt,
      deletedAt: null,
      createdAt,
      updatedAt: createdAt,
    }
    this.rows.set(stored.id, stored)
    return { ...stored }
  }

  async findById(churchId: string, id: string): Promise<AnnouncementRow | null> {
    const row = this.rows.get(id)
    return row && row.churchId === churchId && !row.deletedAt ? { ...row } : null
  }

  async updateWhenStatus(
    churchId: string,
    id: string,
    expected: AnnouncementStatus[],
    patch: AnnouncementPatch,
  ): Promise<AnnouncementRow | null> {
    const row = this.rows.get(id)
    if (!row || row.churchId !== churchId || row.deletedAt || !expected.includes(row.status)) return null
    const next: AnnouncementRow = { ...row, ...patch, updatedAt: new Date(row.updatedAt.getTime() + 1) }
    this.rows.set(id, next)
    return { ...next }
  }

  async page(query: PageQuery): Promise<AnnouncementRow[]> {
    const cursor = query.afterId ? this.rows.get(query.afterId) : undefined
    if (query.afterId && (!cursor || cursor.churchId !== query.churchId)) return []

    const sortKey = (row: AnnouncementRow) => (row.publishedAt ?? row.createdAt).getTime()
    let list = [...this.rows.values()].filter((row) => row.churchId === query.churchId && !row.deletedAt)
    if (query.memberVisibleOnly) {
      list = list.filter((row) => row.status === 'published' && (!row.expiresAt || row.expiresAt > query.now))
    } else if (query.status) {
      list = list.filter((row) => row.status === query.status)
    }
    if (cursor) {
      const cursorKey = sortKey(cursor)
      list = list.filter((row) => sortKey(row) < cursorKey || (sortKey(row) === cursorKey && row.id < cursor.id))
    }
    list.sort((a, b) => sortKey(b) - sortKey(a) || (a.id < b.id ? 1 : -1))
    return list.slice(0, query.limit).map((row) => ({ ...row }))
  }

  async findViewerProfile(churchId: string, userId: string): Promise<ViewerProfile | null> {
    const profile = this.viewers.get(`${churchId}:${userId}`)
    if (!profile) return null
    const { churchId: _church, ...rest } = profile
    return rest
  }

  async getRequireApproval(churchId: string): Promise<boolean> {
    return this.approvalSettings.get(churchId) ?? false
  }
}

class TestAnnouncementsService extends AnnouncementsService {
  constructor(repo: AnnouncementRepository, private readonly clock: { now: Date }) {
    super(repo)
  }

  protected now(): Date {
    return new Date(this.clock.now)
  }
}

const draft = (overrides: Record<string, unknown> = {}) =>
  ({ title: 'Harambee Ijumaa', body: VALID_BODY, ...overrides }) as unknown as CreateAnnouncementDto

async function errorOf(promise: Promise<unknown>): Promise<{ status: number; code?: string }> {
  try {
    await promise
  } catch (error) {
    const httpError = error as { getStatus: () => number; getResponse: () => unknown }
    const response = httpError.getResponse() as { code?: string }
    return { status: httpError.getStatus(), code: response?.code }
  }
  throw new Error('expected the call to reject')
}

describe('AnnouncementsService', () => {
  let repo: InMemoryAnnouncementRepository
  let clock: { now: Date }
  let service: TestAnnouncementsService

  beforeEach(() => {
    repo = new InMemoryAnnouncementRepository()
    clock = { now: new Date('2026-12-01T06:00:00Z') }
    service = new TestAnnouncementsService(repo, clock)

    repo.viewers.set(`${CHURCH_A}:member-f`, {
      churchId: CHURCH_A, userId: 'member-f', memberId: 'mem-f', gender: 'female', maritalStatus: 'married', zoneIds: [ZONE_1],
    })
    repo.viewers.set(`${CHURCH_A}:member-m`, {
      churchId: CHURCH_A, userId: 'member-m', memberId: 'mem-m', gender: 'male', maritalStatus: 'single', zoneIds: [ZONE_2],
    })
    repo.viewers.set(`${CHURCH_A}:account-only`, {
      churchId: CHURCH_A, userId: 'account-only', memberId: null, gender: null, maritalStatus: null, zoneIds: [],
    })
    repo.viewers.set(`${CHURCH_B}:member-b`, {
      churchId: CHURCH_B, userId: 'member-b', memberId: 'mem-b', gender: 'female', maritalStatus: 'married', zoneIds: [ZONE_1],
    })
  })

  describe('create', () => {
    it('creates a draft owned by the actor with the default audience and in_app channel', async () => {
      const view = await service.create(admin, draft())
      expect(view).toMatchObject({ status: 'draft', channels: ['in_app'], audience: { allMembers: true }, createdBy: 'admin-a' })
      expect(repo.rows.get(view.id)?.churchId).toBe(CHURCH_A)
    })

    it('ignores a churchId supplied in the body and uses the guard-validated tenant', async () => {
      const view = await service.create(admin, draft({ churchId: CHURCH_B }))
      expect(repo.rows.get(view.id)?.churchId).toBe(CHURCH_A)
    })

    it('rejects a body with script markup with ANNOUNCEMENT_BODY_INVALID (400)', async () => {
      const body = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '<script>alert(1)</script>' }] }] }
      expect(await errorOf(service.create(admin, draft({ body })))).toEqual({ status: 400, code: 'ANNOUNCEMENT_BODY_INVALID' })
    })

    it('rejects a javascript: link with ANNOUNCEMENT_BODY_INVALID', async () => {
      const body = {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }] }],
      }
      expect(await errorOf(service.create(admin, draft({ body })))).toMatchObject({ code: 'ANNOUNCEMENT_BODY_INVALID' })
    })

    it('rejects an unknown channel with INVALID_CHANNELS', async () => {
      expect(await errorOf(service.create(admin, draft({ channels: ['push'] })))).toMatchObject({ status: 400, code: 'INVALID_CHANNELS' })
    })

    it('rejects an SMS body over the cap with SMS_TOO_LONG, and accepts one at the cap', async () => {
      expect(await errorOf(service.create(admin, draft({ smsBody: 'a'.repeat(460) })))).toEqual({ status: 400, code: 'SMS_TOO_LONG' })
      await expect(service.create(admin, draft({ smsBody: 'a'.repeat(459) }))).resolves.toBeDefined()
    })

    it('rejects an expiry that is not in the future with INVALID_EXPIRY', async () => {
      expect(await errorOf(service.create(admin, draft({ expiresAt: '2026-11-01T00:00:00Z' })))).toMatchObject({ code: 'INVALID_EXPIRY' })
    })

    it('never shows a draft to members, in the list or on detail', async () => {
      const view = await service.create(admin, draft())
      expect((await service.list(memberFemale, {})).items).toEqual([])
      expect(await errorOf(service.get(memberFemale, view.id))).toEqual({ status: 404, code: 'ANNOUNCEMENT_NOT_FOUND' })
    })
  })

  describe('update', () => {
    it('edits a draft', async () => {
      const view = await service.create(admin, draft())
      const updated = await service.update(admin, view.id, { title: '  Harambee  ' } as UpdateAnnouncementDto)
      expect(updated.title).toBe('Harambee')
    })

    it('refuses to edit anything but a draft with ANNOUNCEMENT_NOT_EDITABLE (409)', async () => {
      const view = await service.create(admin, draft())
      await service.publish(admin, view.id)
      expect(await errorOf(service.update(admin, view.id, { title: 'Changed' } as UpdateAnnouncementDto))).toEqual({
        status: 409,
        code: 'ANNOUNCEMENT_NOT_EDITABLE',
      })
    })

    it('validates a replacement body', async () => {
      const view = await service.create(admin, draft())
      const body = { type: 'doc', content: [{ type: 'script', text: 'x' }] }
      expect(await errorOf(service.update(admin, view.id, { body } as UpdateAnnouncementDto))).toMatchObject({
        code: 'ANNOUNCEMENT_BODY_INVALID',
      })
    })
  })

  describe('publish and visibility', () => {
    it('publishes straight through when the church does not require approval (default off)', async () => {
      const view = await service.create(admin, draft())
      const published = await service.publish(admin, view.id)
      expect(published).toMatchObject({ status: 'published', publishedAt: clock.now.toISOString() })
    })

    it('shows the published body to an in-audience member and hides it from an out-of-audience one', async () => {
      const zoneOnly = await service.create(admin, draft({ audience: { zoneIds: [ZONE_1] } }))
      await service.publish(admin, zoneOnly.id)

      const detail = await service.get(memberFemale, zoneOnly.id)
      expect(detail.body).toEqual(VALID_BODY)
      expect(detail.status).toBeUndefined()

      expect((await service.list(memberFemale, {})).items.map((item) => item.id)).toEqual([zoneOnly.id])
      expect(await errorOf(service.get(memberMale, zoneOnly.id))).toEqual({ status: 404, code: 'ANNOUNCEMENT_NOT_FOUND' })
      expect((await service.list(memberMale, {})).items).toEqual([])
      expect(await errorOf(service.get(accountOnly, zoneOnly.id))).toEqual({ status: 404, code: 'ANNOUNCEMENT_NOT_FOUND' })
    })

    it('stops showing a published item to members once it expires, and keeps it for staff', async () => {
      const view = await service.create(admin, draft({ expiresAt: new Date(clock.now.getTime() + 3_600_000).toISOString() }))
      await service.publish(admin, view.id)
      expect((await service.list(memberFemale, {})).items).toHaveLength(1)

      clock.now = new Date(clock.now.getTime() + 2 * 3_600_000)
      expect((await service.list(memberFemale, {})).items).toEqual([])
      expect(await errorOf(service.get(memberFemale, view.id))).toEqual({ status: 404, code: 'ANNOUNCEMENT_NOT_FOUND' })
      expect((await service.list(admin, {})).items.map((item) => item.id)).toEqual([view.id])
    })

    it('is idempotent for a repeated Idempotency-Key and rejects a second publish without one', async () => {
      const view = await service.create(admin, draft())
      const first = await service.publish(admin, view.id, 'key-1')
      const replay = await service.publish(admin, view.id, 'key-1')
      expect(replay).toEqual(first)
      expect(await errorOf(service.publish(admin, view.id))).toEqual({ status: 409, code: 'ALREADY_PUBLISHED' })
      expect(await errorOf(service.publish(admin, view.id, 'key-2'))).toEqual({ status: 409, code: 'ALREADY_PUBLISHED' })
    })

    it('rejects an Idempotency-Key that is too long or has spaces with INVALID_IDEMPOTENCY_KEY', async () => {
      const view = await service.create(admin, draft())
      expect(await errorOf(service.publish(admin, view.id, 'x'.repeat(65)))).toMatchObject({ code: 'INVALID_IDEMPOTENCY_KEY' })
      expect(await errorOf(service.publish(admin, view.id, 'two words'))).toMatchObject({ code: 'INVALID_IDEMPOTENCY_KEY' })
    })

    it('refuses to publish a filtered audience with no filters (AUDIENCE_EMPTY, 422)', async () => {
      const view = await service.create(admin, draft({ audience: {} }))
      expect(await errorOf(service.publish(admin, view.id))).toEqual({ status: 422, code: 'AUDIENCE_EMPTY' })
    })

    it('reports UNKNOWN ids as not found, including ids that are not UUIDs', async () => {
      expect(await errorOf(service.publish(admin, UNKNOWN_ID))).toEqual({ status: 404, code: 'ANNOUNCEMENT_NOT_FOUND' })
      expect(await errorOf(service.get(admin, 'not-a-uuid'))).toEqual({ status: 404, code: 'ANNOUNCEMENT_NOT_FOUND' })
    })
  })

  describe('schedule and cancel', () => {
    it('schedules at least 60 seconds ahead and keeps the item hidden from members until it publishes', async () => {
      const view = await service.create(admin, draft())
      expect(await errorOf(service.schedule(admin, view.id, { scheduledAt: new Date(clock.now.getTime() + 30_000).toISOString() } as ScheduleAnnouncementDto)))
        .toEqual({ status: 400, code: 'SCHEDULE_TOO_SOON' })

      const scheduled = await service.schedule(admin, view.id, {
        scheduledAt: new Date(clock.now.getTime() + 2 * 3_600_000).toISOString(),
      } as ScheduleAnnouncementDto)
      expect(scheduled.status).toBe('scheduled')
      expect((await service.list(memberFemale, {})).items).toEqual([])

      const published = await service.publish(admin, view.id)
      expect(published.status).toBe('published')
    })

    it('refuses a schedule that expires before it goes out (INVALID_EXPIRY)', async () => {
      const view = await service.create(admin, draft({ expiresAt: new Date(clock.now.getTime() + 3_600_000).toISOString() }))
      expect(
        await errorOf(service.schedule(admin, view.id, { scheduledAt: new Date(clock.now.getTime() + 2 * 3_600_000).toISOString() } as ScheduleAnnouncementDto)),
      ).toMatchObject({ code: 'INVALID_EXPIRY' })
    })

    it('cancels a draft, which then never reaches members', async () => {
      const view = await service.create(admin, draft())
      const cancelled = await service.cancel(admin, view.id)
      expect(cancelled).toMatchObject({ status: 'cancelled' })
      expect((await service.list(memberFemale, {})).items).toEqual([])
      expect((await service.list(admin, {})).items.map((item) => item.status)).toEqual(['cancelled'])
    })

    it('does not cancel a published announcement', async () => {
      const view = await service.create(admin, draft())
      await service.publish(admin, view.id)
      expect(await errorOf(service.cancel(admin, view.id))).toEqual({ status: 409, code: 'INVALID_STATE_TRANSITION' })
    })
  })

  describe('approval gate (D-05)', () => {
    beforeEach(() => {
      repo.approvalSettings.set(CHURCH_A, true)
    })

    it('moves a publisher\'s publish to pending_approval and keeps it from members', async () => {
      const view = await service.create(publisher, draft())
      const pending = await service.publish(publisher, view.id)
      expect(pending.status).toBe('pending_approval')
      expect((await service.list(memberFemale, {})).items).toEqual([])
    })

    it('blocks the author from approving their own pending announcement (SELF_APPROVAL_FORBIDDEN)', async () => {
      const view = await service.create(publisher, draft())
      await service.publish(publisher, view.id)
      expect(await errorOf(service.publish(publisher, view.id))).toEqual({ status: 403, code: 'SELF_APPROVAL_FORBIDDEN' })
    })

    it('blocks an admin author from approving their own pending announcement', async () => {
      const view = await service.create(admin, draft())
      await service.publish(admin, view.id)
      expect(await errorOf(service.publish(admin, view.id))).toEqual({ status: 403, code: 'SELF_APPROVAL_FORBIDDEN' })
    })

    it('lets a different admin approve and publish, recording who approved and when', async () => {
      const view = await service.create(publisher, draft())
      await service.publish(publisher, view.id)
      const published = await service.publish(secondAdmin, view.id)
      expect(published).toMatchObject({ status: 'published', approvedBy: 'admin-a2', approvedAt: clock.now.toISOString() })
      expect((await service.list(memberFemale, {})).items.map((item) => item.id)).toEqual([view.id])
    })

    it('refuses approval from a publisher who lacks approve:announcements (APPROVAL_PERMISSION_REQUIRED)', async () => {
      const view = await service.create(admin, draft())
      await service.publish(admin, view.id)
      const otherPublisher: AnnouncementActor = { churchId: CHURCH_A, userId: 'publisher-2', role: 'publisher' }
      expect(await errorOf(service.publish(otherPublisher, view.id))).toEqual({ status: 403, code: 'APPROVAL_PERMISSION_REQUIRED' })
    })

    it('keeps a pending request gated even if the setting is switched off afterwards', async () => {
      const view = await service.create(publisher, draft())
      await service.publish(publisher, view.id)
      repo.approvalSettings.set(CHURCH_A, false)
      expect(await errorOf(service.publish(publisher, view.id))).toEqual({ status: 403, code: 'SELF_APPROVAL_FORBIDDEN' })
    })

    it('publishes without the gate once the setting is off, read on each call', async () => {
      repo.approvalSettings.set(CHURCH_A, false)
      const view = await service.create(publisher, draft())
      expect((await service.publish(publisher, view.id)).status).toBe('published')
    })

    it('an approver scheduling a pending request keeps the schedule and records the approval', async () => {
      const view = await service.create(publisher, draft())
      await service.schedule(publisher, view.id, {
        scheduledAt: new Date(clock.now.getTime() + 2 * 3_600_000).toISOString(),
      } as ScheduleAnnouncementDto)
      const scheduled = await service.publish(secondAdmin, view.id)
      expect(scheduled).toMatchObject({ status: 'scheduled', approvedBy: 'admin-a2' })
    })
  })

  describe('tenant isolation', () => {
    it('gives another church no access to an announcement: 404 on read, publish, edit and cancel', async () => {
      const view = await service.create(admin, draft())
      await service.publish(admin, view.id)

      expect(await errorOf(service.get(adminB, view.id))).toEqual({ status: 404, code: 'ANNOUNCEMENT_NOT_FOUND' })
      expect(await errorOf(service.update(adminB, view.id, { title: 'x' } as UpdateAnnouncementDto))).toEqual({ status: 404, code: 'ANNOUNCEMENT_NOT_FOUND' })
      expect(await errorOf(service.cancel(adminB, view.id))).toEqual({ status: 404, code: 'ANNOUNCEMENT_NOT_FOUND' })
      expect(await errorOf(service.publish(adminB, view.id))).toEqual({ status: 404, code: 'ANNOUNCEMENT_NOT_FOUND' })
    })

    it('keeps staff and member lists inside their own church', async () => {
      const mine = await service.create(admin, draft())
      await service.publish(admin, mine.id)
      const theirs = await service.create(adminB, draft({ title: 'Church B news' }))
      await service.publish(adminB, theirs.id)

      expect((await service.list(adminB, {})).items.map((item) => item.id)).toEqual([theirs.id])
      expect((await service.list(memberB, {})).items.map((item) => item.id)).toEqual([theirs.id])
      expect((await service.list(memberFemale, {})).items.map((item) => item.id)).toEqual([mine.id])
    })

    it('rejects a foreign cursor without leaking rows', async () => {
      const mine = await service.create(admin, draft())
      await service.publish(admin, mine.id)
      const page = await service.list(adminB, { cursor: mine.id })
      expect(page).toEqual({ items: [], nextCursor: null })
    })
  })

  describe('list', () => {
    it('pages through member-visible items, skipping out-of-audience rows, without duplicates', async () => {
      const published: string[] = []
      for (let i = 0; i < 4; i += 1) {
        clock.now = new Date(clock.now.getTime() + 60_000)
        const everyone = await service.create(admin, draft({ title: `All ${i}` }))
        await service.publish(admin, everyone.id)
        published.push(everyone.id)

        clock.now = new Date(clock.now.getTime() + 60_000)
        const zoneTwo = await service.create(admin, draft({ title: `Zone two ${i}`, audience: { zoneIds: [ZONE_2] } }))
        await service.publish(admin, zoneTwo.id)
      }
      // Newest first. Zone-two items are skipped for member-f (ZONE_1) and included for member-m (ZONE_2).
      const expectedForF = [...published].reverse()

      const seenByF: string[] = []
      let cursor: string | undefined
      do {
        const page = await service.list(memberFemale, { limit: 2, cursor })
        seenByF.push(...page.items.map((item) => item.id))
        cursor = page.nextCursor ?? undefined
      } while (cursor)
      expect(seenByF).toEqual(expectedForF)

      const seenByM = (await service.list(memberMale, { limit: 100 })).items.map((item) => item.title)
      expect(seenByM).toHaveLength(8)
      expect(seenByM).toContain('Zone two 3')
    })

    it('returns no next cursor on a short final page', async () => {
      const view = await service.create(admin, draft())
      await service.publish(admin, view.id)
      expect(await service.list(memberFemale, { limit: 5 })).toEqual({
        items: [expect.objectContaining({ id: view.id })],
        nextCursor: null,
      })
    })

    it('rejects a malformed cursor with INVALID_CURSOR', async () => {
      expect(await errorOf(service.list(admin, { cursor: 'nope' }))).toMatchObject({ code: 'INVALID_CURSOR' })
    })

    it('lets staff filter by status, and ignores the status filter for members', async () => {
      const draftView = await service.create(admin, draft({ title: 'Draft one' }))
      const publishedView = await service.create(admin, draft({ title: 'Published one' }))
      await service.publish(admin, publishedView.id)

      expect((await service.list(admin, { status: 'draft' })).items.map((item) => item.id)).toEqual([draftView.id])
      expect((await service.list(memberFemale, { status: 'draft' })).items.map((item) => item.id)).toEqual([publishedView.id])
    })
  })
})
