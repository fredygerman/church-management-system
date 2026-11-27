"use server"

import { revalidatePath } from "next/cache"
import type { Locale, MessageKey } from "@church/config"
import { apiRequest, type ApiResponse } from "@/lib/api-client"
import { checkPermission } from "@/lib/permissions-server"

// Verse API calls for the staff editor. The API's error code is read directly here, because the shared
// apiGet/apiPost helpers keep only the message text. Errors map to verses.* keys; raw server text is never shown.

export interface VerseEntry {
  id: string
  reference: string
  textEn: string
  textSw: string | null
  active: boolean
  updatedAt: string
}

export interface VerseOverride {
  date: string
  entryId: string
  reference: string
}

export interface VerseToday {
  date: string
  reference: string
  text: string | null
  locale: Locale
  source: "override" | "rotation" | "default"
}

export interface VerseEntryInput {
  reference: string
  textEn: string
  textSw: string | null
}

export type VerseEntryPatch = Partial<VerseEntryInput> & { active?: boolean }

export type VerseErrorKey = Extract<
  MessageKey,
  "verses.error.generic" | "verses.error.noPermission" | "verses.overrides.pastDate"
>

export type VerseResult<T> = { ok: true; data: T } | { ok: false; errorKey: VerseErrorKey }

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE"

function codeOf(response: ApiResponse<unknown>): string | undefined {
  const nested = (response.error as { code?: unknown } | undefined)?.code
  const direct = (response as { code?: unknown }).code
  const value = nested ?? direct
  return typeof value === "string" ? value : undefined
}

function errorKeyFor(response: ApiResponse<unknown>): VerseErrorKey {
  if (codeOf(response) === "DATE_IN_PAST") return "verses.overrides.pastDate"
  if (response.statusCode === 403) return "verses.error.noPermission"
  return "verses.error.generic"
}

async function call<T>(
  method: Method,
  url: string,
  options: { params?: Record<string, string>; data?: unknown } = {},
): Promise<VerseResult<T>> {
  const response = await apiRequest<T>({
    requestConfig: { method, url, params: options.params, data: options.data },
  })
  // A 204 has no body, so the shared client reports a JSON parse failure with the real status. Treat 204 as success.
  if (response.statusCode === 204) return { ok: true, data: undefined as T }
  if (!response.success) return { ok: false, errorKey: errorKeyFor(response) }
  return { ok: true, data: response.data as T }
}

async function write<T>(
  churchId: string,
  method: Method,
  url: string,
  data?: unknown,
): Promise<VerseResult<T>> {
  if (!(await checkPermission("manage:verses"))) {
    return { ok: false, errorKey: "verses.error.noPermission" }
  }
  const result = await call<T>(method, url, { data })
  if (result.ok) revalidatePath(`/${churchId}/dashboard/verses`)
  return result
}

// ---- Reads (view:verses) ----

export async function loadVerseToday(locale: Locale): Promise<VerseResult<VerseToday>> {
  return call<VerseToday>("GET", "/verses/today", { params: { locale } })
}

export async function loadVerseEntries(): Promise<VerseResult<VerseEntry[]>> {
  const result = await call<{ items: VerseEntry[] }>("GET", "/verses/entries")
  if (!result.ok) return result
  return { ok: true, data: result.data?.items ?? [] }
}

export async function loadVerseOverrides(from: string, to: string): Promise<VerseResult<VerseOverride[]>> {
  const result = await call<{ items: VerseOverride[] }>("GET", "/verses/overrides", { params: { from, to } })
  if (!result.ok) return result
  return { ok: true, data: result.data?.items ?? [] }
}

// ---- Writes (manage:verses) ----

export async function createVerseEntry(churchId: string, input: VerseEntryInput): Promise<VerseResult<VerseEntry>> {
  const body = {
    reference: input.reference,
    textEn: input.textEn,
    // Omit the optional Swahili text when it is empty, rather than sending null on create.
    ...(input.textSw ? { textSw: input.textSw } : {}),
  }
  return write<VerseEntry>(churchId, "POST", "/verses/entries", body)
}

export async function updateVerseEntry(
  churchId: string,
  id: string,
  patch: VerseEntryPatch,
): Promise<VerseResult<VerseEntry>> {
  return write<VerseEntry>(churchId, "PATCH", `/verses/entries/${encodeURIComponent(id)}`, patch)
}

export async function deleteVerseEntry(churchId: string, id: string): Promise<VerseResult<undefined>> {
  return write<undefined>(churchId, "DELETE", `/verses/entries/${encodeURIComponent(id)}`)
}

export async function setVerseOverride(
  churchId: string,
  date: string,
  entryId: string,
): Promise<VerseResult<VerseOverride>> {
  return write<VerseOverride>(churchId, "PUT", `/verses/overrides/${encodeURIComponent(date)}`, { entryId })
}

export async function clearVerseOverride(churchId: string, date: string): Promise<VerseResult<undefined>> {
  return write<undefined>(churchId, "DELETE", `/verses/overrides/${encodeURIComponent(date)}`)
}
