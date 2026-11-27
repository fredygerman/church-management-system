import { BUILTIN_VERSES } from './builtin-verses'
import { dayOfYear } from './verse-calendar'

export type VerseSource = 'override' | 'rotation' | 'default'
export type VerseLocale = 'en' | 'sw'

export interface VerseCandidate {
  reference: string
  textEn: string
  textSw: string | null
}

export interface ResolvedVerse extends VerseCandidate {
  source: VerseSource
}

export interface DailyVerse {
  date: string
  reference: string
  /** English text for en; Swahili text for sw, or null when no Swahili text exists. */
  text: string | null
  locale: VerseLocale
  source: VerseSource
}

export interface ResolveVerseInput {
  /** YYYY-MM-DD in Africa/Dar_es_Salaam. */
  date: string
  /** Verse pinned to this date by staff, whether or not it is still in rotation. */
  override?: VerseCandidate | null
  /** The church's active verses, ordered by created_at ascending. */
  activeEntries: readonly VerseCandidate[]
  /** Fallback list; defaults to the built-in seven. */
  builtin?: readonly VerseCandidate[]
}

/**
 * Resolution order for one church and one date:
 *   1. a staff override for the date            -> source 'override'
 *   2. the church's active verses, rotated by   -> source 'rotation'
 *      dayOfYear(date) mod count
 *   3. the built-in list, rotated the same way  -> source 'default'
 * Day of year is 1-based (1 January is 1).
 */
export function resolveVerseForDate(input: ResolveVerseInput): ResolvedVerse {
  if (input.override) {
    return { ...pickFields(input.override), source: 'override' }
  }

  const day = dayOfYear(input.date)

  if (input.activeEntries.length > 0) {
    const index = day % input.activeEntries.length
    return { ...pickFields(input.activeEntries[index]), source: 'rotation' }
  }

  const builtin = input.builtin ?? BUILTIN_VERSES
  const index = day % builtin.length
  return { ...pickFields(builtin[index]), source: 'default' }
}

/** Shapes a resolved verse for one locale. Swahili never falls back to English text. */
export function toDailyVerse(date: string, resolved: ResolvedVerse, locale: VerseLocale): DailyVerse {
  return {
    date,
    reference: resolved.reference,
    text: locale === 'sw' ? resolved.textSw : resolved.textEn,
    locale,
    source: resolved.source,
  }
}

function pickFields(verse: VerseCandidate): VerseCandidate {
  return { reference: verse.reference, textEn: verse.textEn, textSw: verse.textSw ?? null }
}
