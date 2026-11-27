import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import type { VerseEntry } from '@church/db'
import { darToday } from './verse-calendar'
import {
  resolveVerseForDate,
  toDailyVerse,
  type DailyVerse,
  type VerseLocale,
} from './verse-resolution'
import {
  parseDateParam,
  parseEntryCreate,
  parseEntryPatch,
  parseOverrideRange,
  validationError,
} from './verse-validation'
import { VersesRepository, type VerseOverrideRow } from './verses.repository'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface VerseEntryDto {
  id: string
  reference: string
  textEn: string
  textSw: string | null
  active: boolean
  updatedAt: string
}

export interface VerseOverrideDto {
  date: string
  entryId: string
  reference: string
}

@Injectable()
export class VersesService {
  constructor(private readonly versesRepository: VersesRepository) {}

  /** The member-facing verse for today (Africa/Dar_es_Salaam) in the requested locale. */
  async getTodayVerse(churchId: string, locale: VerseLocale): Promise<DailyVerse> {
    return this.resolveForDate(churchId, darToday(), locale)
  }

  async resolveForDate(churchId: string, date: string, locale: VerseLocale): Promise<DailyVerse> {
    const override = await this.versesRepository.findOverride(churchId, date)
    const activeEntries = override ? [] : await this.versesRepository.listActiveEntries(churchId)
    const resolved = resolveVerseForDate({
      date,
      override: override ? { reference: override.reference, textEn: override.textEn, textSw: override.textSw } : null,
      activeEntries,
    })
    return toDailyVerse(date, resolved, locale)
  }

  async listEntries(churchId: string): Promise<{ items: VerseEntryDto[] }> {
    const rows = await this.versesRepository.listEntries(churchId)
    return { items: rows.map(toEntryDto) }
  }

  async createEntry(churchId: string, userId: string | null, body: unknown): Promise<VerseEntryDto> {
    const input = parseEntryCreate(body)
    const row = await this.versesRepository.insertEntry(churchId, userId, input)
    return toEntryDto(row)
  }

  async updateEntry(churchId: string, entryId: string, body: unknown): Promise<VerseEntryDto> {
    const patch = parseEntryPatch(body)
    if (!isUuid(entryId)) throw entryNotFound()
    const row = await this.versesRepository.updateEntry(churchId, entryId, { ...patch, updatedAt: new Date() })
    if (!row) throw entryNotFound()
    return toEntryDto(row)
  }

  async deleteEntry(churchId: string, entryId: string): Promise<void> {
    if (!isUuid(entryId)) throw entryNotFound()
    const deleted = await this.versesRepository.deleteEntry(churchId, entryId)
    if (!deleted) throw entryNotFound()
  }

  async listOverrides(churchId: string, from: unknown, to: unknown): Promise<{ items: VerseOverrideDto[] }> {
    const range = parseOverrideRange(from, to)
    const rows = await this.versesRepository.listOverrides(churchId, range.from, range.to)
    return { items: rows.map(toOverrideDto) }
  }

  async setOverride(churchId: string, userId: string | null, dateParam: unknown, body: unknown): Promise<VerseOverrideDto> {
    const date = parseDateParam(dateParam)
    assertNotPast(date)

    const entryId = requireEntryId(body)
    const entry = isUuid(entryId) ? await this.versesRepository.findEntry(churchId, entryId) : undefined
    if (!entry) throw entryNotFound()

    await this.versesRepository.upsertOverride(churchId, date, entry.id, userId)
    return { date, entryId: entry.id, reference: entry.reference }
  }

  async clearOverride(churchId: string, dateParam: unknown): Promise<void> {
    const date = parseDateParam(dateParam)
    assertNotPast(date)
    await this.versesRepository.deleteOverride(churchId, date)
  }
}

function assertNotPast(date: string): void {
  if (date < darToday()) {
    throw new ConflictException({ message: 'Verses cannot be changed for a past date', code: 'DATE_IN_PAST' })
  }
}

function requireEntryId(body: unknown): string {
  const entryId = body && typeof body === 'object' ? (body as Record<string, unknown>).entryId : undefined
  if (typeof entryId !== 'string' || entryId.trim() === '') {
    throw validationError('entryId is required')
  }
  return entryId.trim()
}

function entryNotFound(): NotFoundException {
  return new NotFoundException({ message: 'Verse entry not found', code: 'ENTRY_NOT_FOUND' })
}

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}

function toEntryDto(row: VerseEntry): VerseEntryDto {
  return {
    id: row.id,
    reference: row.reference,
    textEn: row.textEn,
    textSw: row.textSw ?? null,
    active: row.active,
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toOverrideDto(row: VerseOverrideRow): VerseOverrideDto {
  return { date: row.date, entryId: row.entryId, reference: row.reference }
}
