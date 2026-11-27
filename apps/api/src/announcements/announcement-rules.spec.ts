import {
  audienceMatches,
  isAudienceEmpty,
  isMemberVisible,
  isStaffRole,
  normalizeAudience,
  normalizeChannels,
} from './announcement-rules'
import type { AnnouncementAudience, AnnouncementRow, ViewerProfile } from './announcements.types'

const ZONE_1 = '11111111-1111-4111-8111-111111111111'
const ZONE_2 = '22222222-2222-4222-8222-222222222222'
const ZONE_3 = '33333333-3333-4333-8333-333333333333'
const NOW = new Date('2026-12-01T06:00:00Z')

const viewers = {
  femaleMarriedZone1: { userId: 'u-f', memberId: 'm-f', gender: 'female', maritalStatus: 'married', zoneIds: [ZONE_1] },
  maleSingleZone2: { userId: 'u-m', memberId: 'm-m', gender: 'male', maritalStatus: 'single', zoneIds: [ZONE_2] },
  // A user with an account but no member record: no demographics and no zones.
  accountOnly: { userId: 'u-a', memberId: null, gender: null, maritalStatus: null, zoneIds: [] },
} satisfies Record<string, ViewerProfile>

const audiences: Record<string, AnnouncementAudience> = {
  allMembers: { allMembers: true },
  zone1: { allMembers: false, zoneIds: [ZONE_1] },
  zone2OrZone3: { allMembers: false, zoneIds: [ZONE_2, ZONE_3] },
  female: { allMembers: false, genders: ['female'] },
  married: { allMembers: false, maritalStatuses: ['married'] },
  zone1AndFemale: { allMembers: false, zoneIds: [ZONE_1], genders: ['female'] },
  zone2AndFemale: { allMembers: false, zoneIds: [ZONE_2], genders: ['female'] },
  emptyFiltered: { allMembers: false },
}

describe('audienceMatches matrix (D-16)', () => {
  // Expected result per [audience][viewer]
  const expected: Record<keyof typeof audiences, Record<keyof typeof viewers, boolean>> = {
    allMembers: { femaleMarriedZone1: true, maleSingleZone2: true, accountOnly: true },
    zone1: { femaleMarriedZone1: true, maleSingleZone2: false, accountOnly: false },
    zone2OrZone3: { femaleMarriedZone1: false, maleSingleZone2: true, accountOnly: false },
    female: { femaleMarriedZone1: true, maleSingleZone2: false, accountOnly: false },
    married: { femaleMarriedZone1: true, maleSingleZone2: false, accountOnly: false },
    zone1AndFemale: { femaleMarriedZone1: true, maleSingleZone2: false, accountOnly: false },
    zone2AndFemale: { femaleMarriedZone1: false, maleSingleZone2: false, accountOnly: false },
    emptyFiltered: { femaleMarriedZone1: false, maleSingleZone2: false, accountOnly: false },
  }

  for (const audienceName of Object.keys(audiences)) {
    for (const viewerName of Object.keys(viewers)) {
      it(`${audienceName} for ${viewerName} -> ${expected[audienceName][viewerName]}`, () => {
        expect(audienceMatches(audiences[audienceName], viewers[viewerName])).toBe(expected[audienceName][viewerName])
      })
    }
  }

  it('treats a filtered audience with no filters as empty', () => {
    expect(isAudienceEmpty(audiences.emptyFiltered)).toBe(true)
    expect(isAudienceEmpty(audiences.allMembers)).toBe(false)
    expect(isAudienceEmpty(audiences.zone1)).toBe(false)
  })
})

describe('normalizeAudience', () => {
  it('defaults to all members when absent', () => {
    expect(normalizeAudience(undefined)).toEqual({ ok: true, value: { allMembers: true } })
    expect(normalizeAudience(null)).toEqual({ ok: true, value: { allMembers: true } })
  })

  it('treats an object without allMembers as a filtered audience, never as everyone', () => {
    const result = normalizeAudience({ zoneIds: [ZONE_1] })
    expect(result).toEqual({ ok: true, value: { allMembers: false, zoneIds: [ZONE_1] } })
  })

  it('treats an empty object as a filtered audience with no filters (empty)', () => {
    const result = normalizeAudience({})
    expect(result.ok).toBe(true)
    if (result.ok === true) expect(isAudienceEmpty(result.value)).toBe(true)
  })

  it('refuses filters combined with allMembers', () => {
    const result = normalizeAudience({ allMembers: true, zoneIds: [ZONE_1] })
    expect(result).toEqual({ ok: false, message: 'audience filters cannot be combined with allMembers' })
  })

  it('refuses unknown keys, non-UUID zones and unsupported enum values', () => {
    expect(normalizeAudience({ allMembers: false, zoneIds: ['zone-1'] }).ok).toBe(false)
    expect(normalizeAudience({ allMembers: false, genders: ['robot'] }).ok).toBe(false)
    expect(normalizeAudience({ allMembers: false, maritalStatuses: ['complicated'] }).ok).toBe(false)
    expect(normalizeAudience({ allMembers: false, ages: [18] }).ok).toBe(false)
    expect(normalizeAudience({ allMembers: 'yes' }).ok).toBe(false)
    expect(normalizeAudience('everyone').ok).toBe(false)
  })

  it('de-duplicates filter values', () => {
    const result = normalizeAudience({ zoneIds: [ZONE_1, ZONE_1.toUpperCase()], genders: ['female', 'female'] })
    expect(result).toEqual({ ok: true, value: { allMembers: false, zoneIds: [ZONE_1], genders: ['female'] } })
  })
})

describe('normalizeChannels', () => {
  it('defaults to in_app', () => {
    expect(normalizeChannels(undefined)).toEqual({ ok: true, value: ['in_app'] })
  })

  it('always includes in_app and keeps a canonical order', () => {
    expect(normalizeChannels(['sms'])).toEqual({ ok: true, value: ['in_app', 'sms'] })
    expect(normalizeChannels(['sms', 'email', 'email'])).toEqual({ ok: true, value: ['in_app', 'email', 'sms'] })
  })

  it('rejects unknown channels and non-array input', () => {
    expect(normalizeChannels(['push']).ok).toBe(false)
    expect(normalizeChannels('sms').ok).toBe(false)
    expect(normalizeChannels([42]).ok).toBe(false)
  })
})

describe('isStaffRole', () => {
  it.each(['super_admin', 'admin', 'branch_admin', 'publisher'])('%s sees every announcement', (role) => {
    expect(isStaffRole(role)).toBe(true)
  })

  it.each(['member', 'usher', 'zone_leader', 'department_leader'])('%s sees only published, in-audience items', (role) => {
    expect(isStaffRole(role)).toBe(false)
  })

  it('treats a missing or unknown role as not staff', () => {
    expect(isStaffRole(undefined)).toBe(false)
    expect(isStaffRole('')).toBe(false)
    expect(isStaffRole('bishop')).toBe(false)
  })
})

describe('isMemberVisible matrix', () => {
  const base: Pick<AnnouncementRow, 'status' | 'expiresAt' | 'deletedAt' | 'audience'> = {
    status: 'published',
    expiresAt: null,
    deletedAt: null,
    audience: { allMembers: true },
  }
  const viewer = viewers.femaleMarriedZone1

  it('shows a published, unexpired, in-audience item', () => {
    expect(isMemberVisible(base, viewer, NOW)).toBe(true)
  })

  it('shows a published item whose expiry is in the future', () => {
    expect(isMemberVisible({ ...base, expiresAt: new Date('2026-12-08T00:00:00Z') }, viewer, NOW)).toBe(true)
  })

  it.each([
    ['draft', { status: 'draft' }],
    ['pending_approval', { status: 'pending_approval' }],
    ['scheduled', { status: 'scheduled' }],
    ['cancelled', { status: 'cancelled' }],
    ['deleted', { deletedAt: new Date('2026-11-30T00:00:00Z') }],
    ['expired', { expiresAt: new Date('2026-11-30T00:00:00Z') }],
    ['expiring exactly now', { expiresAt: NOW }],
    ['outside the audience', { audience: audiences.zone2OrZone3 }],
  ] as const)('hides a %s item from a member', (_label, override) => {
    expect(isMemberVisible({ ...base, ...override } as typeof base, viewer, NOW)).toBe(false)
  })

  it('hides a zone-targeted item from an account with no member record', () => {
    expect(isMemberVisible({ ...base, audience: audiences.zone1 }, viewers.accountOnly, NOW)).toBe(false)
  })
})
