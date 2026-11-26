import type { Ionicons } from "@expo/vector-icons"
import type { Locale } from "@church/config/i18n"
import { copy, dayKey, timeFromServiceName, weekdayName } from "./format"

export type IconName = keyof typeof Ionicons.glyphMap
export type RsvpStatus = "going" | "maybe" | "declined"

export type EventRecord = {
  id: string
  title: string
  description: string | null
  location: string | null
  startsAt: string
  endsAt: string | null
  status: string
}

export type ServiceSession = {
  id: string
  title: string | null
  sessionDate: string
  status: string
  serviceType: { id: string; name: string } | null
}

export type ServiceSchedule = {
  id: string
  name: string
  subtitle: string
  icon: IconName
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null
}

export function normalizeEvent(raw: Record<string, unknown>): EventRecord | null {
  const id = readString(raw.id)
  const startsAt = readString(raw.startsAt)
  if (!id || !startsAt) return null
  return {
    id,
    title: readString(raw.title) ?? "",
    description: readString(raw.description),
    location: readString(raw.location),
    startsAt,
    endsAt: readString(raw.endsAt),
    status: readString(raw.status) ?? "",
  }
}

export function toRsvpStatus(value: unknown): RsvpStatus | null {
  return value === "going" || value === "maybe" || value === "declined" ? value : null
}

/** The API returns every status and every date. Members see published events from today onward, soonest first. */
export function upcomingEvents(events: EventRecord[], today: string): EventRecord[] {
  return events
    .filter((event) => event.status === "published" && (dayKey(event.startsAt) ?? "") >= today)
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
}

function serviceIcon(name: string): IconName {
  if (/vijana/i.test(name)) return "people-outline"
  if (/maombi/i.test(name)) return "hand-left-outline"
  if (/ibada|jumapili/i.test(name)) return "business-outline"
  return "calendar-outline"
}

/**
 * Weekly schedule: one row per service type, using the weekday of its next upcoming session.
 * Sessions carry a date but no time, so a time appears only when the service name states one.
 */
export function serviceSchedule(sessions: ServiceSession[], today: string, locale: Locale): ServiceSchedule[] {
  const next = new Map<string, { name: string; date: string }>()
  for (const session of sessions) {
    if (!session.serviceType || session.sessionDate < today) continue
    const current = next.get(session.serviceType.id)
    if (!current || session.sessionDate < current.date) next.set(session.serviceType.id, { name: session.serviceType.name, date: session.sessionDate })
  }
  return [...next.entries()]
    .sort(([, a], [, b]) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .map(([id, { name, date }]) => {
      const day = weekdayName(date, locale)
      const time = timeFromServiceName(name)
      const every = copy(locale, { en: "Every {day}", sw: "Kila {day}" }, { day })
      return { id, name, subtitle: time ? `${every} · ${time}` : every, icon: serviceIcon(name) }
    })
}

export type NotificationPresentation = { icon: IconName; title: string; body: string | null }

/** Turns a notification's template key and data into a readable title and excerpt. */
export function describeNotification(templateKey: string, templateData: Record<string, unknown>, locale: Locale, fallbackTitle: string): NotificationPresentation {
  const subject = readString(templateData.title)
  if (templateKey === "events.created") {
    return { icon: "calendar-outline", title: copy(locale, { en: "New event", sw: "Tukio jipya" }), body: subject }
  }
  if (templateKey === "library.document_published") {
    return { icon: "library-outline", title: copy(locale, { en: "New resource", sw: "Nyenzo mpya" }), body: subject }
  }
  return { icon: "notifications-outline", title: fallbackTitle, body: subject }
}
