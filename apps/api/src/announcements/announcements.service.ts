import { BadRequestException, HttpStatus, Inject, Injectable } from '@nestjs/common'
import { resolveTransition, type AnnouncementAction } from './announcement-state'
import {
  isAudienceEmpty,
  isMemberVisible,
  isStaffRole,
  normalizeAudience,
  normalizeChannels,
  SCHEDULE_MIN_LEAD_MS,
  SMS_BODY_MAX_CHARS,
} from './announcement-rules'
import { validateDocV1 } from './doc-v1.validator'
import {
  ANNOUNCEMENT_REPOSITORY,
  announcementError,
  type AnnouncementAudience,
  type AnnouncementChannel,
  type AnnouncementPatch,
  type AnnouncementRepository,
  type AnnouncementRow,
  type AnnouncementStatus,
  type ViewerProfile,
} from './announcements.types'
import type { CreateAnnouncementDto, ScheduleAnnouncementDto, UpdateAnnouncementDto } from './dto/announcement.dto'

/** Tenant and actor, taken from the guard-validated request. Never from the body. */
export interface AnnouncementActor {
  churchId: string
  userId: string
  role: string
}

export interface AnnouncementView {
  id: string
  title: string
  summary: string | null
  bodyFormat: string
  channels: AnnouncementChannel[]
  publishedAt: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
  body?: unknown
  status?: AnnouncementStatus
  audience?: AnnouncementAudience
  smsBody?: string | null
  scheduledAt?: string | null
  cancelledAt?: string | null
  createdBy?: string | null
  approvedBy?: string | null
  approvedAt?: string | null
}

export interface AnnouncementPage {
  items: AnnouncementView[]
  nextCursor: string | null
}

export interface AnnouncementListQuery {
  limit?: number
  cursor?: string
  status?: AnnouncementStatus
}

const DEFAULT_PAGE_LIMIT = 20
const MAX_PAGE_LIMIT = 100
const MAX_IDEMPOTENCY_KEY_LENGTH = 64
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const STATUS_FILTERS: readonly AnnouncementStatus[] = ['draft', 'pending_approval', 'scheduled', 'published', 'cancelled']

@Injectable()
export class AnnouncementsService {
  constructor(@Inject(ANNOUNCEMENT_REPOSITORY) private readonly repo: AnnouncementRepository) {}

  async create(actor: AnnouncementActor, dto: CreateAnnouncementDto): Promise<AnnouncementView> {
    const title = normalizeTitle(dto.title)
    const body = requireValidBody(dto.body)
    const channels = unwrap(normalizeChannels(dto.channels), 'INVALID_CHANNELS')
    const audience = unwrap(normalizeAudience(dto.audience), 'INVALID_AUDIENCE')
    const smsBody = normalizeSmsBody(dto.smsBody)
    const expiresAt = parseOptionalDate(dto.expiresAt)
    if (expiresAt && expiresAt.getTime() <= this.now().getTime()) {
      throw announcementError(HttpStatus.BAD_REQUEST, 'INVALID_EXPIRY', 'expiresAt must be in the future')
    }

    const row = await this.repo.insert({
      churchId: actor.churchId,
      title,
      summary: normalizeSummary(dto.summary),
      bodyFormat: 'doc_v1',
      body,
      channels,
      audience,
      smsBody,
      status: 'draft',
      createdBy: actor.userId,
      expiresAt,
      scheduledAt: null,
    })
    return this.toView(row, true, true)
  }

  async update(actor: AnnouncementActor, id: string, dto: UpdateAnnouncementDto): Promise<AnnouncementView> {
    const current = await this.loadOrNotFound(actor.churchId, id)
    if (current.status !== 'draft') {
      throw announcementError(HttpStatus.CONFLICT, 'ANNOUNCEMENT_NOT_EDITABLE', 'Only draft announcements can be edited')
    }

    const patch: AnnouncementPatch = {}
    if (dto.title !== undefined) patch.title = normalizeTitle(dto.title)
    if (dto.summary !== undefined) patch.summary = normalizeSummary(dto.summary ?? undefined)
    if (dto.body !== undefined) patch.body = requireValidBody(dto.body)
    if (dto.channels !== undefined) patch.channels = unwrap(normalizeChannels(dto.channels), 'INVALID_CHANNELS')
    if (dto.audience !== undefined) patch.audience = unwrap(normalizeAudience(dto.audience), 'INVALID_AUDIENCE')
    if (dto.smsBody !== undefined) patch.smsBody = normalizeSmsBody(dto.smsBody ?? undefined)
    if (dto.expiresAt !== undefined) {
      const expiresAt = parseOptionalDate(dto.expiresAt ?? undefined)
      if (expiresAt && expiresAt.getTime() <= this.now().getTime()) {
        throw announcementError(HttpStatus.BAD_REQUEST, 'INVALID_EXPIRY', 'expiresAt must be in the future')
      }
      patch.expiresAt = expiresAt
    }

    // The conditional write keeps a concurrent publish from being overwritten by an edit.
    const updated = await this.repo.updateWhenStatus(actor.churchId, id, ['draft'], patch)
    if (!updated) {
      throw announcementError(HttpStatus.CONFLICT, 'ANNOUNCEMENT_NOT_EDITABLE', 'Only draft announcements can be edited')
    }
    return this.toView(updated, true, true)
  }

  /** Publish now. Idempotency-Key replays return the current record without a second transition. */
  async publish(actor: AnnouncementActor, id: string, idempotencyKey?: string): Promise<AnnouncementView> {
    const key = normalizeIdempotencyKey(idempotencyKey)
    return this.transition(actor, id, 'publish', null, key)
  }

  async schedule(actor: AnnouncementActor, id: string, dto: ScheduleAnnouncementDto): Promise<AnnouncementView> {
    const scheduledAt = parseOptionalDate(dto.scheduledAt)
    if (!scheduledAt) {
      throw new BadRequestException('scheduledAt must be a valid date-time')
    }
    if (scheduledAt.getTime() < this.now().getTime() + SCHEDULE_MIN_LEAD_MS) {
      throw announcementError(HttpStatus.BAD_REQUEST, 'SCHEDULE_TOO_SOON', 'scheduledAt must be at least 60 seconds in the future')
    }
    return this.transition(actor, id, 'schedule', scheduledAt, null)
  }

  async cancel(actor: AnnouncementActor, id: string): Promise<AnnouncementView> {
    const row = await this.loadOrNotFound(actor.churchId, id)
    const outcome = resolveTransition({
      status: row.status,
      action: 'cancel',
      requireApproval: false,
      actorId: actor.userId,
      actorRole: actor.role,
      authorId: row.createdBy,
      alreadyApproved: row.approvedBy !== null,
      pendingScheduled: row.scheduledAt !== null,
      pendingScheduledAt: row.scheduledAt,
      now: this.now(),
    })
    if (outcome.ok === false) throw announcementError(outcome.httpStatus, outcome.code, outcome.message)

    const updated = await this.repo.updateWhenStatus(actor.churchId, id, [row.status], {
      status: 'cancelled',
      cancelledAt: this.now(),
    })
    if (!updated) throw announcementError(HttpStatus.CONFLICT, 'CONCURRENT_UPDATE', 'The announcement changed; reload and try again')
    return this.toView(updated, true, true)
  }

  async list(actor: AnnouncementActor, query: AnnouncementListQuery): Promise<AnnouncementPage> {
    const staff = isStaffRole(actor.role)
    const limit = clampLimit(query.limit)
    const cursor = normalizeCursor(query.cursor)
    const status = staff && query.status && STATUS_FILTERS.includes(query.status) ? query.status : undefined
    const now = this.now()
    const viewer = staff ? null : await this.viewerFor(actor)
    const batchSize = Math.min(100, Math.max(limit * 2, DEFAULT_PAGE_LIMIT))

    const items: AnnouncementView[] = []
    let afterId = cursor
    let lastReturnedId: string | null = null

    while (items.length < limit) {
      const batch = await this.repo.page({
        churchId: actor.churchId,
        memberVisibleOnly: !staff,
        status,
        afterId,
        limit: batchSize,
        now,
      })
      if (batch.length === 0) break

      // Members filter by audience in memory, so scan forward until the page is full or the rows run out.
      for (const row of batch) {
        afterId = row.id
        const visible = staff || (viewer !== null && isMemberVisible(row, viewer, now))
        if (!visible) continue
        items.push(this.toView(row, staff, false))
        lastReturnedId = row.id
        if (items.length === limit) break
      }
      if (batch.length < batchSize) break
    }

    return {
      items,
      nextCursor: items.length === limit ? lastReturnedId : null,
    }
  }

  async get(actor: AnnouncementActor, id: string): Promise<AnnouncementView> {
    const staff = isStaffRole(actor.role)
    const row = await this.loadOrNotFound(actor.churchId, id)
    if (staff) {
      return this.toView(row, true, true)
    }
    // Members get 404 for drafts, cancelled, expired and out-of-audience rows, so the existence of hidden rows is not revealed.
    const viewer = await this.viewerFor(actor)
    if (!isMemberVisible(row, viewer, this.now())) {
      throw announcementError(HttpStatus.NOT_FOUND, 'ANNOUNCEMENT_NOT_FOUND', 'Announcement not found')
    }
    return this.toView(row, false, true)
  }

  /** Clock seam for tests; production uses the wall clock. */
  protected now(): Date {
    return new Date()
  }

  private async transition(
    actor: AnnouncementActor,
    id: string,
    action: Exclude<AnnouncementAction, 'cancel'>,
    requestedScheduleAt: Date | null,
    idempotencyKey: string | null,
  ): Promise<AnnouncementView> {
    const row = await this.loadOrNotFound(actor.churchId, id)

    if (idempotencyKey !== null && row.publishIdempotencyKey === idempotencyKey) {
      return this.toView(row, true, true)
    }

    const requireApproval = await this.repo.getRequireApproval(actor.churchId)
    const now = this.now()
    const outcome = resolveTransition({
      status: row.status,
      action,
      requireApproval,
      actorId: actor.userId,
      actorRole: actor.role,
      authorId: row.createdBy,
      alreadyApproved: row.approvedBy !== null,
      pendingScheduled: row.scheduledAt !== null,
      pendingScheduledAt: row.scheduledAt,
      now,
    })
    if (outcome.ok === false) throw announcementError(outcome.httpStatus, outcome.code, outcome.message)

    // A request to schedule records its time (pending or scheduled). An approver publishing a pending
    // schedule keeps the requested time. A publish request records no time.
    let scheduledAt: Date | null = row.scheduledAt
    if (outcome.next === 'pending_approval' || (action === 'schedule' && outcome.next === 'scheduled')) {
      scheduledAt = requestedScheduleAt
    }

    // Expiry is checked against the time the item will actually go out.
    const effectiveAt = outcome.next === 'published' ? now : (scheduledAt ?? now)
    assertReadyToSend(row, effectiveAt)

    const patch: AnnouncementPatch = {
      status: outcome.next,
      scheduledAt,
    }
    if (outcome.next === 'published') patch.publishedAt = now
    if (outcome.approves) {
      patch.approvedBy = actor.userId
      patch.approvedAt = now
    }
    if (idempotencyKey !== null) patch.publishIdempotencyKey = idempotencyKey

    const updated = await this.repo.updateWhenStatus(actor.churchId, id, [row.status], patch)
    if (!updated) throw announcementError(HttpStatus.CONFLICT, 'CONCURRENT_UPDATE', 'The announcement changed; reload and try again')
    return this.toView(updated, true, true)
  }

  private async loadOrNotFound(churchId: string, id: string): Promise<AnnouncementRow> {
    if (!UUID_RE.test(id)) {
      throw announcementError(HttpStatus.NOT_FOUND, 'ANNOUNCEMENT_NOT_FOUND', 'Announcement not found')
    }
    const row = await this.repo.findById(churchId, id)
    if (!row || row.deletedAt) {
      throw announcementError(HttpStatus.NOT_FOUND, 'ANNOUNCEMENT_NOT_FOUND', 'Announcement not found')
    }
    return row
  }

  private async viewerFor(actor: AnnouncementActor): Promise<ViewerProfile> {
    const profile = await this.repo.findViewerProfile(actor.churchId, actor.userId)
    return profile ?? { userId: actor.userId, memberId: null, gender: null, maritalStatus: null, zoneIds: [] }
  }

  private toView(row: AnnouncementRow, staff: boolean, includeBody: boolean): AnnouncementView {
    const view: AnnouncementView = {
      id: row.id,
      title: row.title,
      summary: row.summary,
      bodyFormat: row.bodyFormat,
      channels: row.channels,
      publishedAt: iso(row.publishedAt),
      expiresAt: iso(row.expiresAt),
      createdAt: iso(row.createdAt) as string,
      updatedAt: iso(row.updatedAt) as string,
    }
    if (includeBody) view.body = row.body
    if (staff) {
      view.status = row.status
      view.audience = row.audience
      view.smsBody = row.smsBody
      view.scheduledAt = iso(row.scheduledAt)
      view.cancelledAt = iso(row.cancelledAt)
      view.createdBy = row.createdBy
      view.approvedBy = row.approvedBy
      view.approvedAt = iso(row.approvedAt)
    }
    return view
  }
}

function assertReadyToSend(row: AnnouncementRow, effectiveAt: Date | null): void {
  if (isAudienceEmpty(row.audience)) {
    throw announcementError(HttpStatus.UNPROCESSABLE_ENTITY, 'AUDIENCE_EMPTY', 'Choose at least one audience filter, or send to all members')
  }
  if (row.expiresAt && effectiveAt && row.expiresAt.getTime() <= effectiveAt.getTime()) {
    throw announcementError(HttpStatus.BAD_REQUEST, 'INVALID_EXPIRY', 'expiresAt must be after the publish time')
  }
  // Stored bodies were checked on write; re-check so a published body is always valid.
  requireValidBody(row.body)
}

function requireValidBody(body: unknown): unknown {
  const result = validateDocV1(body)
  if (result.ok === false) {
    throw announcementError(HttpStatus.BAD_REQUEST, 'ANNOUNCEMENT_BODY_INVALID', result.issues.join('; '))
  }
  return result.doc
}

function normalizeTitle(title: unknown): string {
  const trimmed = typeof title === 'string' ? title.trim() : ''
  if (trimmed.length === 0) throw new BadRequestException('title is required')
  return trimmed
}

function normalizeSummary(summary: string | undefined): string | null {
  if (summary === undefined) return null
  const trimmed = summary.trim()
  return trimmed.length === 0 ? null : trimmed
}

function normalizeSmsBody(smsBody: string | undefined): string | null {
  if (smsBody === undefined) return null
  const trimmed = smsBody.trim()
  if (trimmed.length === 0) return null
  if (trimmed.length > SMS_BODY_MAX_CHARS) {
    throw announcementError(HttpStatus.BAD_REQUEST, 'SMS_TOO_LONG', `smsBody must be at most ${SMS_BODY_MAX_CHARS} characters`)
  }
  return trimmed
}

function normalizeIdempotencyKey(key: string | undefined): string | null {
  if (key === undefined || key === null) return null
  const trimmed = key.trim()
  if (trimmed.length === 0 || trimmed.length > MAX_IDEMPOTENCY_KEY_LENGTH || !/^[\x21-\x7e]+$/.test(trimmed)) {
    throw announcementError(HttpStatus.BAD_REQUEST, 'INVALID_IDEMPOTENCY_KEY', 'Idempotency-Key must be 1 to 64 visible ASCII characters')
  }
  return trimmed
}

function normalizeCursor(cursor: string | undefined): string | undefined {
  if (cursor === undefined || cursor === '') return undefined
  if (!UUID_RE.test(cursor)) {
    throw announcementError(HttpStatus.BAD_REQUEST, 'INVALID_CURSOR', 'cursor is not valid')
  }
  return cursor
}

function clampLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit)) return DEFAULT_PAGE_LIMIT
  return Math.min(MAX_PAGE_LIMIT, Math.max(1, Math.trunc(limit)))
}

function parseOptionalDate(value: string | undefined): Date | null {
  if (value === undefined || value === null || value === '') return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('Dates must be valid ISO 8601 date-times')
  }
  return date
}

function unwrap<T>(result: { ok: true; value: T } | { ok: false; message: string }, code: 'INVALID_CHANNELS' | 'INVALID_AUDIENCE'): T {
  if (result.ok === false) throw announcementError(HttpStatus.BAD_REQUEST, code, result.message)
  return result.value
}

function iso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null
}
