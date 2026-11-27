import { HttpException, HttpStatus } from '@nestjs/common'

/**
 * Domain types for announcements. Deliberately independent of '@church/db' so that
 * the pure rules and the service can be unit-tested without the database layer.
 */

export const ANNOUNCEMENT_REPOSITORY = Symbol('ANNOUNCEMENT_REPOSITORY')

export type AnnouncementStatus = 'draft' | 'pending_approval' | 'scheduled' | 'published' | 'cancelled'
export type AnnouncementChannel = 'in_app' | 'email' | 'sms'
export type AnnouncementBodyFormat = 'plain' | 'doc_v1'
export type Gender = 'male' | 'female' | 'others'
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed'

export interface AnnouncementAudience {
  allMembers: boolean
  zoneIds?: string[]
  genders?: Gender[]
  maritalStatuses?: MaritalStatus[]
}

export interface AnnouncementRow {
  id: string
  churchId: string
  title: string
  summary: string | null
  bodyFormat: AnnouncementBodyFormat
  body: unknown
  channels: AnnouncementChannel[]
  audience: AnnouncementAudience
  smsBody: string | null
  status: AnnouncementStatus
  publishIdempotencyKey: string | null
  createdBy: string | null
  approvedBy: string | null
  approvedAt: Date | null
  scheduledAt: Date | null
  publishedAt: Date | null
  cancelledAt: Date | null
  expiresAt: Date | null
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type NewAnnouncementRow = Pick<
  AnnouncementRow,
  'churchId' | 'title' | 'summary' | 'bodyFormat' | 'body' | 'channels' | 'audience' | 'smsBody' | 'status' | 'createdBy' | 'expiresAt' | 'scheduledAt'
>

export type AnnouncementPatch = Partial<
  Pick<
    AnnouncementRow,
    | 'title'
    | 'summary'
    | 'body'
    | 'channels'
    | 'audience'
    | 'smsBody'
    | 'expiresAt'
    | 'status'
    | 'publishIdempotencyKey'
    | 'approvedBy'
    | 'approvedAt'
    | 'scheduledAt'
    | 'publishedAt'
    | 'cancelledAt'
  >
>

/** What the viewer's audience membership looks like. Null fields mean the viewer has no member record. */
export interface ViewerProfile {
  userId: string
  memberId: string | null
  gender: Gender | null
  maritalStatus: MaritalStatus | null
  zoneIds: string[]
}

export interface PageQuery {
  churchId: string
  /** Members: published rows only, not cancelled, not expired. Staff: every non-deleted row. */
  memberVisibleOnly: boolean
  status?: AnnouncementStatus
  afterId?: string
  limit: number
  now: Date
}

export interface AnnouncementRepository {
  insert(row: NewAnnouncementRow): Promise<AnnouncementRow>
  findById(churchId: string, id: string): Promise<AnnouncementRow | null>
  /** Conditional update: applies only while the row is still in one of `expected`. Returns null otherwise. */
  updateWhenStatus(
    churchId: string,
    id: string,
    expected: AnnouncementStatus[],
    patch: AnnouncementPatch,
  ): Promise<AnnouncementRow | null>
  /** Keyset page ordered by (coalesce(published_at, created_at) desc, id desc). */
  page(query: PageQuery): Promise<AnnouncementRow[]>
  /** Scheduler only. Not tenant-scoped: scheduled rows with scheduled_at <= now, oldest first, at most `limit`. */
  findDueScheduled(now: Date, limit: number): Promise<AnnouncementRow[]>
  findViewerProfile(churchId: string, userId: string): Promise<ViewerProfile | null>
  getRequireApproval(churchId: string): Promise<boolean>
}

/** Stable error codes from the lane 05 contract. Body is `{ statusCode, message, code }`. */
export type AnnouncementErrorCode =
  | 'ANNOUNCEMENT_BODY_INVALID'
  | 'ANNOUNCEMENT_NOT_EDITABLE'
  | 'ANNOUNCEMENT_NOT_FOUND'
  | 'SELF_APPROVAL_FORBIDDEN'
  | 'APPROVAL_PERMISSION_REQUIRED'
  | 'ALREADY_PUBLISHED'
  | 'INVALID_STATE_TRANSITION'
  | 'AUDIENCE_EMPTY'
  | 'SMS_TOO_LONG'
  | 'SCHEDULE_TOO_SOON'
  | 'INVALID_EXPIRY'
  | 'INVALID_CHANNELS'
  | 'CHANNEL_NOT_AVAILABLE'
  | 'INVALID_AUDIENCE'
  | 'INVALID_IDEMPOTENCY_KEY'
  | 'INVALID_CURSOR'
  | 'CONCURRENT_UPDATE'

export function announcementError(status: HttpStatus, code: AnnouncementErrorCode, message: string): HttpException {
  return new HttpException({ statusCode: status, message, code }, status)
}
