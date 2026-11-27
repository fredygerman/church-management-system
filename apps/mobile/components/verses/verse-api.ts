import type { Locale } from "@church/config/i18n"
import { api } from "../../lib/api"
import type { VerseSource } from "./next-days"

// Contract (API, in progress): see the verse of the day endpoints in apps/api. Errors arrive as {message, code};
// lib/api.ts keeps only the HTTP status, so screens map errors by status.

export type TodayVerse = { date: string; reference: string; text: string | null; locale: Locale; source: VerseSource }

export type VerseEntry = { id: string; reference: string; textEn: string; textSw: string | null; active: boolean; updatedAt: string }

export type VerseOverride = { date: string; entryId: string; reference: string }

export type VerseEntryInput = { reference: string; textEn: string; textSw?: string | null }

type Items<T> = { items: T[] }

function itemsOf<T>(value: Items<T> | null | undefined): T[] {
  return value && Array.isArray(value.items) ? value.items : []
}

export const verseApi = {
  /** Member card. Permission: none beyond sign-in. */
  today: (locale: Locale) => api.get<TodayVerse>(`/verses/today?locale=${locale}`),

  /** Permission: view:verses. */
  listEntries: () => api.get<Items<VerseEntry>>("/verses/entries").then(itemsOf),

  /** Permission: manage:verses. */
  createEntry: (input: VerseEntryInput) => api.post<VerseEntry>("/verses/entries", input),

  /** Permission: manage:verses. Partial update; `active` toggles rotation. */
  updateEntry: (id: string, patch: Partial<VerseEntryInput> & { active?: boolean }) => api.patch<VerseEntry>(`/verses/entries/${encodeURIComponent(id)}`, patch),

  /** Permission: manage:verses. */
  deleteEntry: (id: string) => api.delete(`/verses/entries/${encodeURIComponent(id)}`),

  /** Permission: view:verses. Dates are YYYY-MM-DD. */
  listOverrides: (from: string, to: string) => api.get<Items<VerseOverride>>(`/verses/overrides?from=${from}&to=${to}`).then(itemsOf),

  /** Permission: manage:verses. 409 DATE_IN_PAST for past days. */
  setOverride: (date: string, entryId: string) => api.put<VerseOverride>(`/verses/overrides/${date}`, { entryId }),

  /** Permission: manage:verses. 409 DATE_IN_PAST for past days. */
  clearOverride: (date: string) => api.delete(`/verses/overrides/${date}`),
}
