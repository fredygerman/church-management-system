import { formatLocaleDate, type Locale, type Translate } from "@church/config/i18n"

// Africa/Dar_es_Salaam is a fixed UTC+3 with no daylight saving, so a fixed offset is exact here.
const DAR_OFFSET_MS = 3 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

/** Shifts an instant so its UTC fields read as Dar es Salaam wall-clock time. */
function toDarWallClock(instant: Date): Date {
  return new Date(instant.getTime() + DAR_OFFSET_MS)
}

/** Whole Dar es Salaam calendar days since the epoch; equal values mean the same local day. */
export function darDayIndex(instant: Date): number {
  return Math.floor((instant.getTime() + DAR_OFFSET_MS) / DAY_MS)
}

/** Parses a plain YYYY-MM-DD service date as Dar es Salaam midnight. */
export function darMidnightFromDateOnly(sessionDate: string): Date {
  return new Date(`${sessionDate}T00:00:00+03:00`)
}

/** Day, short month and time (Dar es Salaam) for the date block and time line. */
export function darDateParts(instant: Date, locale: Locale) {
  const wall = toDarWallClock(instant)
  return {
    day: String(wall.getUTCDate()),
    month: formatLocaleDate(wall, locale, { month: "short", timeZone: "UTC" }),
    time: formatLocaleDate(wall, locale, { hour: "numeric", minute: "2-digit", timeZone: "UTC" }),
  }
}

/** "Today", "Yesterday", "N days ago" for the last week, then a calendar date. */
export function formatRelativeDar(instant: Date, now: Date, locale: Locale, t: Translate): string {
  const days = darDayIndex(now) - darDayIndex(instant)
  if (days === 0) return t("mobile.member.home.today")
  if (days === 1) return t("mobile.member.home.yesterday")
  if (days > 1 && days < 7) return t("mobile.member.home.daysAgo", { count: days })
  return formatLocaleDate(toDarWallClock(instant), locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
}
