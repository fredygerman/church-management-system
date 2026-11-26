import type { Locale } from './index'

// Browser language tag per language. English keeps day-month-year; Swahili uses Tanzanian conventions.
const TAGS: Record<Locale, string> = { en: 'en-GB', sw: 'sw-TZ' }

// Plain options (no dateStyle or timeStyle) so the same call works in the mobile JS engine.
export const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }

/** Formats a date in the current language. Returns '' for a missing or invalid date; callers pick their own fallback first. */
export function formatLocaleDate(
  value: string | number | Date | null | undefined,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = DEFAULT_DATE_OPTIONS,
): string {
  if (value === null || value === undefined || value === '') return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(TAGS[locale], options).format(date)
}

/** Formats a whole number with the current language's digit grouping. */
export function formatLocaleNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(TAGS[locale]).format(value)
}
