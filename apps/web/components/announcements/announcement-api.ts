// Server-only loaders for the member announcement endpoints. Imported by server components and
// server actions only: apiRequest reads the signed-in session. Errors are reduced to a status;
// server message text is never returned to the page.
import { apiRequest, type ApiResponse } from "@/lib/api-client"

export interface AnnouncementSummary {
  id: string
  title: string
  summary: string | null
  status: string
  publishedAt: string | null
  createdAt: string
}

export interface AnnouncementDetail {
  id: string
  title: string
  summary: string | null
  status: string
  body: unknown
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export type LoadResult<T> = { status: "ok"; value: T } | { status: "not_found" } | { status: "error" }

// The ids come from the route. Keep only plausible ids, and encode them into the path.
const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/

function isRedirectSignal(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")
}

function isNotFound(response: ApiResponse): boolean {
  const code = (response.error as { code?: unknown } | undefined)?.code
  return response.statusCode === 404 || code === "NOT_FOUND"
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export async function loadAnnouncements(churchId: string): Promise<LoadResult<AnnouncementSummary[]>> {
  if (!ID_PATTERN.test(churchId)) return { status: "error" }
  try {
    const response = await apiRequest<{ items?: unknown }>({
      requestConfig: { method: "GET", url: "/announcements", params: { churchId } },
    })
    if (!response.success || !isRecord(response.data) || !Array.isArray(response.data.items)) {
      return { status: "error" }
    }
    const items = response.data.items.filter(
      (item): item is AnnouncementSummary =>
        isRecord(item) && typeof item.id === "string" && typeof item.title === "string"
    )
    return { status: "ok", value: items }
  } catch (error) {
    if (isRedirectSignal(error)) throw error
    return { status: "error" }
  }
}

export async function loadAnnouncement(churchId: string, id: string): Promise<LoadResult<AnnouncementDetail>> {
  if (!ID_PATTERN.test(churchId) || !ID_PATTERN.test(id)) return { status: "not_found" }
  try {
    const response = await apiRequest<AnnouncementDetail>({
      requestConfig: {
        method: "GET",
        url: `/announcements/${encodeURIComponent(id)}`,
        params: { churchId },
      },
    })
    if (!response.success) {
      return isNotFound(response) ? { status: "not_found" } : { status: "error" }
    }
    if (!isRecord(response.data) || typeof response.data.id !== "string") return { status: "error" }
    return { status: "ok", value: response.data }
  } catch (error) {
    if (isRedirectSignal(error)) throw error
    return { status: "error" }
  }
}
