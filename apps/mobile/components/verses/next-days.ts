// Pure date and row logic for the staff verse screen. No React Native imports, so node tests can load it.

export type VerseSource = "override" | "rotation" | "default"

export type DayOverride = { date: string; entryId: string; reference: string }

export type VerseDayRow = {
  date: string
  isToday: boolean
  source: VerseSource
  /** Set only for days with a staff-chosen verse. */
  entryId: string | null
  reference: string | null
}

const DAR_OFFSET_MS = 3 * 60 * 60 * 1000 // Africa/Dar_es_Salaam is a fixed UTC+3.

/** Today's date in Dar es Salaam as YYYY-MM-DD. */
export function darTodayIso(now: Date = new Date()): string {
  return new Date(now.getTime() + DAR_OFFSET_MS).toISOString().slice(0, 10)
}

/** Adds whole days to a YYYY-MM-DD date. Pure calendar arithmetic (UTC), so no DST or local-zone drift. */
export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}

/**
 * Builds the rows for today and the following days.
 * A day with a staff override shows that entry. Other days follow the automatic rotation:
 * "rotation" when the church list has at least one active entry, otherwise the built-in default
 * (the API only lists overrides, so this mirrors the rule the API applies).
 */
export function buildNextDays(todayIso: string, overrides: DayOverride[], hasActiveEntries: boolean, count = 30): VerseDayRow[] {
  const overrideByDate = new Map(overrides.map((override) => [override.date, override]))
  const automaticSource: VerseSource = hasActiveEntries ? "rotation" : "default"
  return Array.from({ length: count }, (_, index) => {
    const date = addDays(todayIso, index)
    const override = overrideByDate.get(date)
    if (override) {
      return { date, isToday: index === 0, source: "override", entryId: override.entryId, reference: override.reference }
    }
    return { date, isToday: index === 0, source: automaticSource, entryId: null, reference: null }
  })
}
