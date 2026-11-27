// Reads the announcement payloads from GET /announcements and GET /announcements/:id.
// Fields the app does not know are ignored; a missing title or summary is an empty string, not an error.

export type AnnouncementListItem = { id: string; title: string; summary: string; date: Date | null }

export type AnnouncementDetail = {
  id: string
  title: string
  summary: string
  body: unknown
  date: Date | null
}

type JsonObject = Record<string, unknown>

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function instant(value: unknown): Date | null {
  if (typeof value !== "string" || value === "") return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Published date when there is one, otherwise the creation date. */
function dateOf(item: JsonObject): Date | null {
  return instant(item.publishedAt) ?? instant(item.createdAt)
}

function summaryItem(raw: unknown): AnnouncementListItem | null {
  if (!isObject(raw)) return null
  const id = text(raw.id)
  if (!id) return null
  return { id, title: text(raw.title), summary: text(raw.summary), date: dateOf(raw) }
}

/** Items from the list response. Anything that is not an item with an id is dropped. */
export function toAnnouncementListItems(payload: unknown): AnnouncementListItem[] {
  if (!isObject(payload) || !Array.isArray(payload.items)) return []
  return payload.items.map(summaryItem).filter((item): item is AnnouncementListItem => item !== null)
}

/** One announcement from the detail response, or null when the response has no id. */
export function toAnnouncementDetail(payload: unknown): AnnouncementDetail | null {
  if (!isObject(payload)) return null
  const id = text(payload.id)
  if (!id) return null
  return { id, title: text(payload.title), summary: text(payload.summary), body: payload.body, date: dateOf(payload) }
}
