import { roleHasPermission, UserRole } from '../auth/types/permission.types'
import type {
  AnnouncementAudience,
  AnnouncementChannel,
  AnnouncementRow,
  Gender,
  MaritalStatus,
  ViewerProfile,
} from './announcements.types'

/** Pure rules for channels, audience and visibility (D-16). No I/O. */

export const ANNOUNCEMENT_CHANNELS: readonly AnnouncementChannel[] = ['in_app', 'email', 'sms']
export const AUDIENCE_GENDERS: readonly Gender[] = ['male', 'female', 'others']
export const AUDIENCE_MARITAL_STATUSES: readonly MaritalStatus[] = ['single', 'married', 'divorced', 'widowed']
export const AUDIENCE_MAX_ZONES = 100
export const SMS_BODY_MAX_CHARS = 459 // three GSM-7 segments (3 x 153); segment rules arrive with RM-072
export const SCHEDULE_MIN_LEAD_MS = 60_000

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const AUDIENCE_KEYS = new Set(['allMembers', 'zoneIds', 'genders', 'maritalStatuses'])

export type RuleResult<T> = { ok: true; value: T } | { ok: false; message: string }

/**
 * Staff are the roles that can see every announcement (including drafts). The matrix grants
 * view:announcements to admin, branch admin, publisher and super admin, and not to member.
 */
export function isStaffRole(role: string | undefined | null): boolean {
  if (!role) return false
  return roleHasPermission(role as UserRole, 'view:announcements')
}

/** in_app is always included. Missing input means in_app only. */
export function normalizeChannels(input: unknown): RuleResult<AnnouncementChannel[]> {
  if (input === undefined || input === null) return { ok: true, value: ['in_app'] }
  if (!Array.isArray(input)) return { ok: false, message: 'channels must be an array' }

  const requested = new Set<string>()
  for (const channel of input) {
    if (typeof channel !== 'string' || !ANNOUNCEMENT_CHANNELS.includes(channel as AnnouncementChannel)) {
      return { ok: false, message: 'channels may only contain in_app, email or sms' }
    }
    requested.add(channel)
  }
  requested.add('in_app')
  return { ok: true, value: ANNOUNCEMENT_CHANNELS.filter((channel) => requested.has(channel)) }
}

/**
 * Audience input. Absent means all members. An object without allMembers is a filtered audience
 * (allMembers false), so a bare filter can never silently widen to the whole church.
 */
export function normalizeAudience(input: unknown): RuleResult<AnnouncementAudience> {
  if (input === undefined || input === null) return { ok: true, value: { allMembers: true } }
  if (typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, message: 'audience must be an object' }
  }
  const raw = input as Record<string, unknown>
  for (const key of Object.keys(raw)) {
    if (!AUDIENCE_KEYS.has(key)) return { ok: false, message: `audience.${key} is not supported` }
  }

  const allMembers = raw.allMembers === undefined ? false : raw.allMembers
  if (typeof allMembers !== 'boolean') return { ok: false, message: 'audience.allMembers must be a boolean' }

  const zoneIds = readUniqueStrings(raw.zoneIds, 'zoneIds')
  if (zoneIds.ok === false) return { ok: false, message: zoneIds.message }
  const genders = readUniqueEnum(raw.genders, 'genders', AUDIENCE_GENDERS)
  if (genders.ok === false) return { ok: false, message: genders.message }
  const maritalStatuses = readUniqueEnum(raw.maritalStatuses, 'maritalStatuses', AUDIENCE_MARITAL_STATUSES)
  if (maritalStatuses.ok === false) return { ok: false, message: maritalStatuses.message }

  const hasFilters = zoneIds.value.length > 0 || genders.value.length > 0 || maritalStatuses.value.length > 0
  if (allMembers) {
    if (hasFilters) return { ok: false, message: 'audience filters cannot be combined with allMembers' }
    return { ok: true, value: { allMembers: true } }
  }

  const value: AnnouncementAudience = { allMembers: false }
  if (zoneIds.value.length > 0) value.zoneIds = zoneIds.value
  if (genders.value.length > 0) value.genders = genders.value as Gender[]
  if (maritalStatuses.value.length > 0) value.maritalStatuses = maritalStatuses.value as MaritalStatus[]
  return { ok: true, value }
}

/** A filtered audience with no filters reaches nobody, so it is refused before publish (AUDIENCE_EMPTY). */
export function isAudienceEmpty(audience: AnnouncementAudience): boolean {
  if (audience.allMembers) return false
  return !(audience.zoneIds?.length || audience.genders?.length || audience.maritalStatuses?.length)
}

/**
 * Members match when every filter that is set matches (AND across dimensions, OR within one).
 * allMembers matches everyone with an account in the church.
 */
export function audienceMatches(audience: AnnouncementAudience, viewer: ViewerProfile): boolean {
  if (audience.allMembers) return true
  if (isAudienceEmpty(audience)) return false

  if (audience.zoneIds?.length) {
    const zones = new Set(viewer.zoneIds)
    if (!audience.zoneIds.some((zoneId) => zones.has(zoneId))) return false
  }
  if (audience.genders?.length) {
    if (!viewer.gender || !audience.genders.includes(viewer.gender)) return false
  }
  if (audience.maritalStatuses?.length) {
    if (!viewer.maritalStatus || !audience.maritalStatuses.includes(viewer.maritalStatus)) return false
  }
  return true
}

/** Member view: published, not cancelled or deleted, not expired, and inside the audience. */
export function isMemberVisible(
  row: Pick<AnnouncementRow, 'status' | 'expiresAt' | 'deletedAt' | 'audience'>,
  viewer: ViewerProfile,
  now: Date,
): boolean {
  if (row.deletedAt) return false
  if (row.status !== 'published') return false
  if (row.expiresAt && row.expiresAt.getTime() <= now.getTime()) return false
  return audienceMatches(row.audience, viewer)
}

export function isValidUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value)
}

function readUniqueStrings(value: unknown, field: string): RuleResult<string[]> {
  if (value === undefined || value === null) return { ok: true, value: [] }
  if (!Array.isArray(value)) return { ok: false, message: `audience.${field} must be an array` }
  if (value.length > AUDIENCE_MAX_ZONES) return { ok: false, message: `audience.${field} has too many entries` }
  const unique = new Set<string>()
  for (const item of value) {
    if (!isValidUuid(item)) return { ok: false, message: `audience.${field} must contain UUIDs` }
    unique.add(item.toLowerCase())
  }
  return { ok: true, value: [...unique] }
}

function readUniqueEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
): RuleResult<T[]> {
  if (value === undefined || value === null) return { ok: true, value: [] }
  if (!Array.isArray(value)) return { ok: false, message: `audience.${field} must be an array` }
  const unique = new Set<T>()
  for (const item of value) {
    if (typeof item !== 'string' || !allowed.includes(item as T)) {
      return { ok: false, message: `audience.${field} contains an unsupported value` }
    }
    unique.add(item as T)
  }
  return { ok: true, value: [...unique] }
}
