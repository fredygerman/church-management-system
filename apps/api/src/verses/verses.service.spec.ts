jest.mock('@church/db', () => ({ db: {}, verseEntries: {}, verseOverrides: {} }))

import { randomUUID } from 'crypto'
import { ConflictException, HttpException, NotFoundException } from '@nestjs/common'
import { BUILTIN_VERSES } from './builtin-verses'
import type { VerseCandidate } from './verse-resolution'
import { VersesService } from './verses.service'
import type { VersesRepository, VerseOverrideRow } from './verses.repository'

const CHURCH_A = 'church-a'
const CHURCH_B = 'church-b'
const USER = 'user-1'

interface StoredEntry {
  id: string
  churchId: string
  reference: string
  textEn: string
  textSw: string | null
  active: boolean
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
}

interface StoredOverride {
  churchId: string
  date: string
  entryId: string
}

/**
 * In-memory stand-in for VersesRepository. Every query filters on churchId, like the
 * real queries, and deleting an entry cascades to its overrides, like the foreign key.
 */
class FakeVersesRepository {
  entries: StoredEntry[] = []
  overrides: StoredOverride[] = []
  private sequence = 0

  async listEntries(churchId: string) {
    return this.entries.filter((e) => e.churchId === churchId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  }

  async listActiveEntries(churchId: string): Promise<VerseCandidate[]> {
    return this.entries
      .filter((e) => e.churchId === churchId && e.active)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((e) => ({ reference: e.reference, textEn: e.textEn, textSw: e.textSw }))
  }

  async findEntry(churchId: string, entryId: string) {
    return this.entries.find((e) => e.churchId === churchId && e.id === entryId)
  }

  async insertEntry(churchId: string, userId: string | null, values: { reference: string; textEn: string; textSw: string | null }) {
    this.sequence += 1
    const now = new Date(Date.UTC(2026, 0, 1) + this.sequence * 1000)
    const row: StoredEntry = {
      id: randomUUID(),
      churchId,
      active: true,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      ...values,
    }
    this.entries.push(row)
    return row
  }

  async updateEntry(churchId: string, entryId: string, patch: Partial<StoredEntry>) {
    const row = this.entries.find((e) => e.churchId === churchId && e.id === entryId)
    if (!row) return undefined
    Object.assign(row, patch)
    return row
  }

  async deleteEntry(churchId: string, entryId: string) {
    const index = this.entries.findIndex((e) => e.churchId === churchId && e.id === entryId)
    if (index === -1) return false
    this.entries.splice(index, 1)
    this.overrides = this.overrides.filter((o) => o.entryId !== entryId)
    return true
  }

  async findOverride(churchId: string, date: string): Promise<VerseOverrideRow | undefined> {
    const override = this.overrides.find((o) => o.churchId === churchId && o.date === date)
    if (!override) return undefined
    const entry = this.entries.find((e) => e.id === override.entryId)
    if (!entry) return undefined
    return { date, entryId: entry.id, reference: entry.reference, textEn: entry.textEn, textSw: entry.textSw }
  }

  async listOverrides(churchId: string, from: string, to: string): Promise<VerseOverrideRow[]> {
    const rows: VerseOverrideRow[] = []
    for (const o of this.overrides) {
      if (o.churchId !== churchId || o.date < from || o.date > to) continue
      const entry = this.entries.find((e) => e.id === o.entryId)
      if (entry) rows.push({ date: o.date, entryId: entry.id, reference: entry.reference, textEn: entry.textEn, textSw: entry.textSw })
    }
    return rows.sort((a, b) => a.date.localeCompare(b.date))
  }

  async upsertOverride(churchId: string, date: string, entryId: string) {
    const existing = this.overrides.find((o) => o.churchId === churchId && o.date === date)
    if (existing) existing.entryId = entryId
    else this.overrides.push({ churchId, date, entryId })
  }

  async deleteOverride(churchId: string, date: string) {
    const before = this.overrides.length
    this.overrides = this.overrides.filter((o) => !(o.churchId === churchId && o.date === date))
    return this.overrides.length < before
  }

  /** Seeds an entry directly, with a fixed created_at so rotation order is predictable. */
  seed(churchId: string, values: Partial<StoredEntry> & { reference: string; textEn: string }) {
    this.sequence += 1
    const row: StoredEntry = {
      id: randomUUID(),
      churchId,
      textSw: null,
      active: true,
      createdBy: USER,
      createdAt: new Date(Date.UTC(2026, 0, 1) + this.sequence * 1000),
      updatedAt: new Date(Date.UTC(2026, 0, 1)),
      ...values,
    }
    this.entries.push(row)
    return row
  }
}

async function errorOf(promise: Promise<unknown>): Promise<HttpException> {
  try {
    await promise
  } catch (error) {
    return error as HttpException
  }
  throw new Error('Expected the promise to reject')
}

describe('VersesService', () => {
  let repo: FakeVersesRepository
  let service: VersesService

  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2026-11-27T10:00:00Z') })
    repo = new FakeVersesRepository()
    service = new VersesService(repo as unknown as VersesRepository)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('getTodayVerse resolution order', () => {
    it('falls back to the built-in list when the church has no verses', async () => {
      const today = await service.getTodayVerse(CHURCH_A, 'en')

      expect(today).toEqual({
        date: '2026-11-27',
        reference: 'Philippians 4:13',
        text: BUILTIN_VERSES[2].textEn,
        locale: 'en',
        source: 'default',
      })
    })

    it('uses the church list rotation when it has active verses', async () => {
      repo.seed(CHURCH_A, { reference: 'Ref A', textEn: 'Verse A text' })
      repo.seed(CHURCH_A, { reference: 'Ref B', textEn: 'Verse B text' })
      repo.seed(CHURCH_A, { reference: 'Ref C', textEn: 'Verse C text' })

      const today = await service.getTodayVerse(CHURCH_A, 'en')

      // 331 mod 3 = 1 selects the second verse created.
      expect(today).toMatchObject({ reference: 'Ref B', source: 'rotation' })
    })

    it('leaves inactive verses out of rotation', async () => {
      repo.seed(CHURCH_A, { reference: 'Only active', textEn: 'Active verse text' })
      repo.seed(CHURCH_A, { reference: 'Retired', textEn: 'Retired verse text', active: false })

      const today = await service.getTodayVerse(CHURCH_A, 'en')

      expect(today.reference).toBe('Only active')
    })

    it('prefers a staff override over the rotation', async () => {
      const pinned = repo.seed(CHURCH_A, { reference: 'Pinned', textEn: 'Pinned verse text' })
      repo.seed(CHURCH_A, { reference: 'Rotation', textEn: 'Rotation verse text' })
      await service.setOverride(CHURCH_A, USER, '2026-11-27', { entryId: pinned.id })

      const today = await service.getTodayVerse(CHURCH_A, 'en')

      expect(today).toMatchObject({ reference: 'Pinned', source: 'override' })
    })

    it('applies an override even when its verse has been taken out of rotation (documented choice)', async () => {
      const retired = repo.seed(CHURCH_A, { reference: 'Retired pin', textEn: 'Retired pin text', active: false })
      await service.setOverride(CHURCH_A, USER, '2026-11-27', { entryId: retired.id })

      const today = await service.getTodayVerse(CHURCH_A, 'en')

      expect(today).toMatchObject({ reference: 'Retired pin', source: 'override' })
    })
  })

  describe('Africa/Dar_es_Salaam day boundary', () => {
    it('serves the next Dar date at 23:30 UTC on the 31st', async () => {
      jest.setSystemTime(new Date('2026-12-31T23:30:00Z'))
      repo.seed(CHURCH_A, { reference: 'Ref A', textEn: 'Verse A text' })
      repo.seed(CHURCH_A, { reference: 'Ref B', textEn: 'Verse B text' })
      repo.seed(CHURCH_A, { reference: 'Ref C', textEn: 'Verse C text' })

      const today = await service.getTodayVerse(CHURCH_A, 'en')

      // 2027-01-01 is day 1; 1 mod 3 = 1 selects the second verse.
      expect(today).toMatchObject({ date: '2027-01-01', reference: 'Ref B' })
    })

    it('still serves the old date just before 21:00 UTC on the 31st', async () => {
      jest.setSystemTime(new Date('2026-12-31T20:59:00Z'))
      repo.seed(CHURCH_A, { reference: 'Ref A', textEn: 'Verse A text' })
      repo.seed(CHURCH_A, { reference: 'Ref B', textEn: 'Verse B text' })
      repo.seed(CHURCH_A, { reference: 'Ref C', textEn: 'Verse C text' })

      const today = await service.getTodayVerse(CHURCH_A, 'en')

      // 2026-12-31 is day 365; 365 mod 3 = 2 selects the third verse.
      expect(today).toMatchObject({ date: '2026-12-31', reference: 'Ref C' })
    })
  })

  describe('Swahili text', () => {
    it('returns null text for sw when the verse has no Swahili text', async () => {
      repo.seed(CHURCH_A, { reference: 'English only', textEn: 'English only text' })

      const today = await service.getTodayVerse(CHURCH_A, 'sw')

      expect(today).toMatchObject({ reference: 'English only', text: null, locale: 'sw' })
    })

    it('returns the Swahili text when it exists', async () => {
      repo.seed(CHURCH_A, { reference: 'Both', textEn: 'English text', textSw: 'Kiswahili text' })

      const today = await service.getTodayVerse(CHURCH_A, 'sw')

      expect(today.text).toBe('Kiswahili text')
    })

    it('returns null text for sw on the built-in fallback', async () => {
      const today = await service.getTodayVerse(CHURCH_A, 'sw')

      expect(today).toMatchObject({ source: 'default', text: null })
    })
  })

  describe('overrides and DATE_IN_PAST', () => {
    it('rejects setting a verse for yesterday in Dar with 409 DATE_IN_PAST', async () => {
      const entry = repo.seed(CHURCH_A, { reference: 'Ref A', textEn: 'Verse A text' })

      const error = await errorOf(service.setOverride(CHURCH_A, USER, '2026-11-26', { entryId: entry.id }))

      expect(error).toBeInstanceOf(ConflictException)
      expect(error.getStatus()).toBe(409)
      expect(error.getResponse()).toMatchObject({ code: 'DATE_IN_PAST' })
      expect(repo.overrides).toHaveLength(0)
    })

    it('rejects clearing an override for a past date with 409 DATE_IN_PAST', async () => {
      const error = await errorOf(service.clearOverride(CHURCH_A, '2026-11-01'))

      expect(error.getStatus()).toBe(409)
      expect(error.getResponse()).toMatchObject({ code: 'DATE_IN_PAST' })
    })

    it('allows setting and clearing today and future dates', async () => {
      const entry = repo.seed(CHURCH_A, { reference: 'Ref A', textEn: 'Verse A text' })

      await expect(service.setOverride(CHURCH_A, USER, '2026-11-27', { entryId: entry.id })).resolves.toEqual({
        date: '2026-11-27',
        entryId: entry.id,
        reference: 'Ref A',
      })
      await expect(service.setOverride(CHURCH_A, USER, '2026-12-05', { entryId: entry.id })).resolves.toMatchObject({
        date: '2026-12-05',
      })
      await expect(service.clearOverride(CHURCH_A, '2026-12-05')).resolves.toBeUndefined()
      expect(repo.overrides.map((o) => o.date)).toEqual(['2026-11-27'])
    })

    it('replaces the verse when a date is set again', async () => {
      const first = repo.seed(CHURCH_A, { reference: 'First', textEn: 'First verse text' })
      const second = repo.seed(CHURCH_A, { reference: 'Second', textEn: 'Second verse text' })

      await service.setOverride(CHURCH_A, USER, '2026-12-01', { entryId: first.id })
      await service.setOverride(CHURCH_A, USER, '2026-12-01', { entryId: second.id })

      expect(repo.overrides).toEqual([{ churchId: CHURCH_A, date: '2026-12-01', entryId: second.id }])
    })

    it('rejects an entryId that is missing or is not a verse of this church', async () => {
      const error = await errorOf(service.setOverride(CHURCH_A, USER, '2026-12-01', {}))
      expect(error.getStatus()).toBe(400)
    })
  })

  describe('tenant isolation', () => {
    it('returns 404 ENTRY_NOT_FOUND when church B tries to pin church A verse', async () => {
      const entryOfA = repo.seed(CHURCH_A, { reference: 'Church A verse', textEn: 'Church A text' })

      const error = await errorOf(service.setOverride(CHURCH_B, USER, '2026-12-01', { entryId: entryOfA.id }))

      expect(error).toBeInstanceOf(NotFoundException)
      expect(error.getResponse()).toMatchObject({ code: 'ENTRY_NOT_FOUND' })
      expect(repo.overrides).toHaveLength(0)
    })

    it('returns 404 ENTRY_NOT_FOUND when church B tries to edit or delete church A verse', async () => {
      const entryOfA = repo.seed(CHURCH_A, { reference: 'Church A verse', textEn: 'Church A text' })

      const updateError = await errorOf(service.updateEntry(CHURCH_B, entryOfA.id, { active: false }))
      const deleteError = await errorOf(service.deleteEntry(CHURCH_B, entryOfA.id))

      expect(updateError.getResponse()).toMatchObject({ code: 'ENTRY_NOT_FOUND' })
      expect(deleteError.getResponse()).toMatchObject({ code: 'ENTRY_NOT_FOUND' })
      expect(entryOfA.active).toBe(true)
      expect(repo.entries).toHaveLength(1)
    })

    it('does not show church A verses to church B', async () => {
      repo.seed(CHURCH_A, { reference: 'Church A verse', textEn: 'Church A text' })

      const list = await service.listEntries(CHURCH_B)
      const today = await service.getTodayVerse(CHURCH_B, 'en')

      expect(list.items).toEqual([])
      expect(today.source).toBe('default')
    })
  })

  describe('entry management', () => {
    it('creates an entry with sanitised text and returns the DTO', async () => {
      const created = await service.createEntry(CHURCH_A, USER, {
        reference: '  Psalm 23:1 ',
        textEn: 'The LORD\u0007 is my shepherd',
        textSw: '   ',
      })

      expect(created).toMatchObject({
        reference: 'Psalm 23:1',
        textEn: 'The LORD is my shepherd',
        textSw: null,
        active: true,
      })
      expect(typeof created.updatedAt).toBe('string')
    })

    it('patches only the supplied fields and can take a verse out of rotation', async () => {
      const entry = repo.seed(CHURCH_A, { reference: 'Ref A', textEn: 'Verse A text', textSw: 'Aya A' })

      const updated = await service.updateEntry(CHURCH_A, entry.id, { active: false, textSw: null })

      expect(updated).toMatchObject({ reference: 'Ref A', textEn: 'Verse A text', textSw: null, active: false })
    })

    it('deletes an entry and removes the overrides that pointed at it', async () => {
      const entry = repo.seed(CHURCH_A, { reference: 'Ref A', textEn: 'Verse A text' })
      await service.setOverride(CHURCH_A, USER, '2026-12-02', { entryId: entry.id })

      await expect(service.deleteEntry(CHURCH_A, entry.id)).resolves.toBeUndefined()

      expect(repo.overrides).toHaveLength(0)
    })

    it('lists overrides for a range and rejects ranges longer than 92 days', async () => {
      const entry = repo.seed(CHURCH_A, { reference: 'Ref A', textEn: 'Verse A text' })
      await service.setOverride(CHURCH_A, USER, '2026-12-03', { entryId: entry.id })

      const list = await service.listOverrides(CHURCH_A, '2026-12-01', '2026-12-31')
      expect(list.items).toEqual([{ date: '2026-12-03', entryId: entry.id, reference: 'Ref A' }])

      const error = await errorOf(service.listOverrides(CHURCH_A, '2026-01-01', '2026-12-31'))
      expect(error.getResponse()).toMatchObject({ code: 'INVALID_RANGE' })
    })
  })
})
