import { formatLocaleDate, type Locale } from "@church/config"

// Shared by the list and the detail page. An unreadable date shows the unknown-date label.
export function formatAnnouncementDate(value: string | null | undefined, unknownLabel: string, locale: Locale): string {
  if (!value) return unknownLabel
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return unknownLabel
  return formatLocaleDate(date, locale)
}
