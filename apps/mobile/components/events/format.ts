import type { Locale } from "@church/config/i18n"

// Church events are shown in Dar es Salaam time. Tanzania is UTC+3 all year (no DST), so a fixed
// offset is exact and avoids relying on Intl timeZone support in the Hermes engine.
const EAT_OFFSET_MS = 3 * 60 * 60 * 1000
const DATE_TAGS: Record<Locale, string> = { en: "en-GB", sw: "sw-TZ" }
const MINUTE_MS = 60 * 1000
const DAY_MS = 24 * 60 * MINUTE_MS

export type Copy = { en: string; sw: string }

/** Picks the locale's text for strings that have no shared translation key yet. */
export function copy(locale: Locale, text: Copy, vars?: Record<string, string | number>): string {
  const raw = locale === "sw" ? text.sw : text.en
  if (!vars) return raw
  return raw.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match))
}

const pad = (value: number) => String(value).padStart(2, "0")

// Shifts an instant so its UTC getters read the Dar es Salaam wall clock.
function wallClock(value: string | Date): Date | null {
  const ms = value instanceof Date ? value.getTime() : Date.parse(value)
  return Number.isNaN(ms) ? null : new Date(ms + EAT_OFFSET_MS)
}

/** YYYY-MM-DD of an instant in Dar es Salaam; comparable as a string. */
export function dayKey(value: string | Date): string | null {
  const date = wallClock(value)
  return date ? `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}` : null
}

export function todayKey(now: Date = new Date()): string {
  return dayKey(now) ?? ""
}

export function monthAbbrev(value: string, locale: Locale): string {
  const date = wallClock(value)
  if (!date) return ""
  return new Intl.DateTimeFormat(DATE_TAGS[locale], { month: "short", timeZone: "UTC" }).format(date).replace(".", "")
}

export function dayOfMonth(value: string): string {
  const date = wallClock(value)
  return date ? String(date.getUTCDate()) : ""
}

/** e.g. "Sat, 5 Dec" */
export function formatEventDay(value: string, locale: Locale): string {
  const date = wallClock(value)
  if (!date) return ""
  return new Intl.DateTimeFormat(DATE_TAGS[locale], { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(date)
}

/** e.g. "9:00 AM" */
export function formatClock(value: string): string {
  const date = wallClock(value)
  if (!date) return ""
  const hours = date.getUTCHours()
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  return `${hour12}:${pad(date.getUTCMinutes())} ${hours < 12 ? "AM" : "PM"}`
}

export function formatTimeRange(startsAt: string, endsAt: string | null): string {
  const start = formatClock(startsAt)
  return endsAt ? `${start} – ${formatClock(endsAt)}` : start
}

/** Weekday name for a plain YYYY-MM-DD session date (noon UTC avoids any day shift). */
export function weekdayName(sessionDate: string, locale: Locale): string {
  const [year, month, day] = sessionDate.split("-").map(Number)
  if (!year || !month || !day) return sessionDate
  return new Intl.DateTimeFormat(DATE_TAGS[locale], { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, day, 12)))
}

/** Reads a clock time such as "9:00 asubuhi" or "6:00 Mchana" from a service name, as "9:00 AM". */
export function timeFromServiceName(name: string): string | null {
  const match = /(\d{1,2})[:.](\d{2})\s*(asubuhi|mchana|jioni|usiku|am|pm)?/i.exec(name)
  if (!match) return null
  const period = match[3]?.toLowerCase()
  const suffix = period === "asubuhi" || period === "am" ? " AM" : period ? " PM" : ""
  return `${Number(match[1])}:${match[2]}${suffix}`
}

/** "Just now", "12m ago", "2h ago", "Yesterday", "3d ago", then a short date. */
export function formatRelativeTime(value: string, locale: Locale, now: Date = new Date()): string {
  const then = Date.parse(value)
  if (Number.isNaN(then)) return ""
  const minutes = Math.floor((now.getTime() - then) / MINUTE_MS)
  if (minutes < 1) return copy(locale, { en: "Just now", sw: "Sasa hivi" })
  if (minutes < 60) return copy(locale, { en: "{n}m ago", sw: "dakika {n} zilizopita" }, { n: minutes })
  const dayDiff = Math.round((Date.parse(`${todayKey(now)}T00:00:00Z`) - Date.parse(`${dayKey(new Date(then))}T00:00:00Z`)) / DAY_MS)
  if (dayDiff <= 0) return copy(locale, { en: "{n}h ago", sw: "saa {n} zilizopita" }, { n: Math.floor(minutes / 60) })
  if (dayDiff === 1) return copy(locale, { en: "Yesterday", sw: "Jana" })
  if (dayDiff < 7) return copy(locale, { en: "{n}d ago", sw: "siku {n} zilizopita" }, { n: dayDiff })
  const date = wallClock(value)
  return date ? new Intl.DateTimeFormat(DATE_TAGS[locale], { day: "numeric", month: "short", timeZone: "UTC" }).format(date) : ""
}
