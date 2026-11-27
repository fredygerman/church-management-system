import { Injectable } from '@nestjs/common'
import { and, asc, eq, gte, lte } from 'drizzle-orm'
import { db, verseEntries, verseOverrides, type VerseEntry } from '@church/db'
import type { VerseCandidate } from './verse-resolution'

export interface VerseOverrideRow {
  date: string
  entryId: string
  reference: string
  textEn: string
  textSw: string | null
}

export interface VerseEntryPatchRow {
  reference?: string
  textEn?: string
  textSw?: string | null
  active?: boolean
  updatedAt: Date
}

/**
 * All verse queries. Every method takes churchId and filters on it, so one church
 * can never read or change another church's verses. Services must not bypass this.
 */
@Injectable()
export class VersesRepository {
  listEntries(churchId: string): Promise<VerseEntry[]> {
    return db
      .select()
      .from(verseEntries)
      .where(eq(verseEntries.churchId, churchId))
      .orderBy(asc(verseEntries.createdAt), asc(verseEntries.id))
  }

  /** Active verses in rotation order (created_at ascending, id as a tie-breaker). */
  async listActiveEntries(churchId: string): Promise<VerseCandidate[]> {
    const rows: VerseEntry[] = await db
      .select()
      .from(verseEntries)
      .where(and(eq(verseEntries.churchId, churchId), eq(verseEntries.active, true)))
      .orderBy(asc(verseEntries.createdAt), asc(verseEntries.id))
    return rows.map((row) => ({ reference: row.reference, textEn: row.textEn, textSw: row.textSw ?? null }))
  }

  async findEntry(churchId: string, entryId: string): Promise<VerseEntry | undefined> {
    const [row] = await db
      .select()
      .from(verseEntries)
      .where(and(eq(verseEntries.id, entryId), eq(verseEntries.churchId, churchId)))
      .limit(1)
    return row
  }

  async insertEntry(
    churchId: string,
    userId: string | null,
    values: { reference: string; textEn: string; textSw: string | null },
  ): Promise<VerseEntry> {
    const [row] = await db
      .insert(verseEntries)
      .values({ churchId, createdBy: userId, ...values })
      .returning()
    return row
  }

  async updateEntry(churchId: string, entryId: string, patch: VerseEntryPatchRow): Promise<VerseEntry | undefined> {
    const [row] = await db
      .update(verseEntries)
      .set(patch)
      .where(and(eq(verseEntries.id, entryId), eq(verseEntries.churchId, churchId)))
      .returning()
    return row
  }

  /** Deletes the entry; overrides that point at it are removed by the database (ON DELETE CASCADE). */
  async deleteEntry(churchId: string, entryId: string): Promise<boolean> {
    const rows = await db
      .delete(verseEntries)
      .where(and(eq(verseEntries.id, entryId), eq(verseEntries.churchId, churchId)))
      .returning({ id: verseEntries.id })
    return rows.length > 0
  }

  async findOverride(churchId: string, date: string): Promise<VerseOverrideRow | undefined> {
    const [row] = await db
      .select(overrideSelection)
      .from(verseOverrides)
      .innerJoin(verseEntries, eq(verseOverrides.entryId, verseEntries.id))
      .where(and(eq(verseOverrides.churchId, churchId), eq(verseOverrides.date, date)))
      .limit(1)
    return row
  }

  listOverrides(churchId: string, from: string, to: string): Promise<VerseOverrideRow[]> {
    return db
      .select(overrideSelection)
      .from(verseOverrides)
      .innerJoin(verseEntries, eq(verseOverrides.entryId, verseEntries.id))
      .where(
        and(
          eq(verseOverrides.churchId, churchId),
          gte(verseOverrides.date, from),
          lte(verseOverrides.date, to),
        ),
      )
      .orderBy(asc(verseOverrides.date))
  }

  /** One override per church per date: a second PUT for the same date replaces the first. */
  async upsertOverride(
    churchId: string,
    date: string,
    entryId: string,
    userId: string | null,
  ): Promise<void> {
    await db
      .insert(verseOverrides)
      .values({ churchId, date, entryId, createdBy: userId })
      .onConflictDoUpdate({
        target: [verseOverrides.churchId, verseOverrides.date],
        set: { entryId, createdBy: userId, createdAt: new Date() },
      })
  }

  async deleteOverride(churchId: string, date: string): Promise<boolean> {
    const rows = await db
      .delete(verseOverrides)
      .where(and(eq(verseOverrides.churchId, churchId), eq(verseOverrides.date, date)))
      .returning({ id: verseOverrides.id })
    return rows.length > 0
  }
}

const overrideSelection = {
  date: verseOverrides.date,
  entryId: verseOverrides.entryId,
  reference: verseEntries.reference,
  textEn: verseEntries.textEn,
  textSw: verseEntries.textSw,
}
