// Pure helpers for the staff verse editor's "next 30 days" table. No React imports, so they can be tested directly.

export const VERSE_SCHEDULE_DAYS = 30

export type VerseSource = "override" | "rotation" | "default"

export interface VerseChoice {
  id: string
  reference: string
  active: boolean
}

export interface VerseDayOverride {
  date: string
  entryId: string
  reference: string
}

export interface VerseDateRow {
  date: string
  isToday: boolean
  // Set only when staff chose a verse for this day.
  entryId: string | null
  reference: string | null
  source: VerseSource
}

// Adds whole days to a YYYY-MM-DD string using UTC arithmetic, so the result does not depend on the server's time zone.
export function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

// One row per day starting at startDate (today). A staff override wins; otherwise the day follows the automatic rotation,
// or the built-in verse when the church list has no active entries.
// The API does not return the automatic pick for future days, so automatic rows carry only their source.
export function buildDateRows(input: {
  startDate: string
  days?: number
  overrides: VerseDayOverride[]
  entries: VerseChoice[]
}): VerseDateRow[] {
  const days = input.days ?? VERSE_SCHEDULE_DAYS
  const overrideByDate = new Map(input.overrides.map((override) => [override.date, override]))
  const hasActiveEntries = input.entries.some((entry) => entry.active)

  return Array.from({ length: days }, (_, index) => {
    const date = addDays(input.startDate, index)
    const override = overrideByDate.get(date)
    const isToday = index === 0

    if (!override) {
      return { date, isToday, entryId: null, reference: null, source: hasActiveEntries ? "rotation" : "default" }
    }

    const entry = input.entries.find((candidate) => candidate.id === override.entryId)
    return {
      date,
      isToday,
      entryId: override.entryId,
      reference: entry?.reference ?? override.reference,
      source: "override",
    }
  })
}

// Entries offered in a day's picker: every active entry, plus the currently chosen one even if it is no longer active,
// so the picker can still show what is set.
export function selectableEntries<T extends VerseChoice>(entries: T[], currentEntryId: string | null): T[] {
  return entries.filter((entry) => entry.active || entry.id === currentEntryId)
}
