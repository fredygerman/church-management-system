/**
 * Calendar helpers for the verse of the day. "Today" is the calendar date in
 * Africa/Dar_es_Salaam, which is UTC+3 with no daylight saving. The offset is
 * applied directly so the result never depends on the host's time zone or ICU data.
 */

export const VERSE_TIME_ZONE = 'Africa/Dar_es_Salaam'
const DAR_OFFSET_MS = 3 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

/** YYYY-MM-DD calendar date in Dar es Salaam for the given instant. */
export function toDarDate(instant: Date): string {
  return new Date(instant.getTime() + DAR_OFFSET_MS).toISOString().slice(0, 10)
}

/** Today's calendar date in Dar es Salaam (YYYY-MM-DD). */
export function darToday(now: Date = new Date()): string {
  return toDarDate(now)
}

/** True when the string is a real calendar date in strict YYYY-MM-DD form. */
export function isValidDateString(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const match = DATE_PATTERN.exec(value)
  if (!match) return false
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const probe = new Date(Date.UTC(year, month - 1, day))
  return probe.getUTCFullYear() === year && probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day
}

/** 1-based day of the year for a YYYY-MM-DD string (1 January is day 1). */
export function dayOfYear(date: string): number {
  const match = DATE_PATTERN.exec(date)
  if (!match) throw new Error(`Invalid date: ${date}`)
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  return Math.round((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 1)) / DAY_MS) + 1
}

/** Number of days from `from` to `to` inclusive, for YYYY-MM-DD strings. */
export function inclusiveDayCount(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00Z`)
  const end = Date.parse(`${to}T00:00:00Z`)
  return Math.round((end - start) / DAY_MS) + 1
}
