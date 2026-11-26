"use server"

import { apiRequest } from "@/lib/api-client"
import { getTranslator } from "@/lib/i18n/server"

export type LibraryResourceType = "document" | "book" | "sermon" | "audio" | "video"
export type LibraryPublicationStatus = "draft" | "review" | "published" | "archived"

export interface LibraryResource {
  id: string
  scope: "network" | "branch"
  branchId: string
  title: string
  description: string | null
  originalFileName: string
  contentType: string
  sizeBytes: number
  resourceType: LibraryResourceType
  language: string | null
  authorSpeaker: string | null
  categories: string[]
  durationSeconds: number | null
  pageCount: number | null
  publicationStatus: LibraryPublicationStatus
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface LibraryResourceProgress {
  resourceId: string
  positionSeconds: number
  pageNumber: number | null
  updatedAt: string
}

export interface LibraryResourceListQuery {
  cursor?: string | null
  query?: string
  resourceType?: LibraryResourceType
  category?: string
  branchId?: string
}

type Result<T> = { status: "ok"; data: T } | { status: "unavailable"; message: string; notFound?: boolean }

function isNextRedirect(error: unknown): boolean {
  return error instanceof Error && error.message.includes("NEXT_REDIRECT")
}

// Envelope: { success, data }. Errors are reported as unavailable, never thrown to the page.
async function call<T>(
  requestConfig: Parameters<typeof apiRequest>[0]["requestConfig"],
  skipAuth = false,
  failureMessage?: string
): Promise<Result<T>> {
  const t = await getTranslator()
  try {
    const response = await apiRequest<T>({ requestConfig, skipAuth })
    if (!response.success || response.data === undefined) {
      return {
        status: "unavailable",
        message: failureMessage ?? t("wiring.common.loadFailed"),
        notFound: response.statusCode === 404,
      }
    }
    return { status: "ok", data: response.data }
  } catch (error) {
    if (isNextRedirect(error)) throw error
    console.error("Library resource request failed:", error)
    return { status: "unavailable", message: failureMessage ?? t("wiring.common.loadFailed") }
  }
}

export async function listLibraryResources(
  churchId: string,
  input: LibraryResourceListQuery = {}
): Promise<Result<{ items: LibraryResource[]; nextCursor: string | null }>> {
  return call(
    {
      method: "GET",
      url: "/library/resources",
      params: {
        churchId,
        cursor: input.cursor ?? undefined,
        query: input.query,
        resourceType: input.resourceType,
        category: input.category,
        branchId: input.branchId,
      },
    }
  )
}

export async function getLibraryResource(churchId: string, resourceId: string): Promise<Result<LibraryResource>> {
  return call({ method: "GET", url: `/library/resources/${encodeURIComponent(resourceId)}`, params: { churchId } })
}

// Returns a short-lived URL only after server-side authorization. Never cache or store it.
export async function createLibraryResourceAccess(
  churchId: string,
  resourceId: string
): Promise<Result<{ url: string; expiresAt: string }>> {
  const t = await getTranslator()
  return call(
    { method: "POST", url: `/library/resources/${encodeURIComponent(resourceId)}/access`, params: { churchId } },
    false,
    t("wiring.library.resource.accessDenied")
  )
}

export async function getLibraryResourceProgress(
  churchId: string,
  resourceId: string
): Promise<Result<LibraryResourceProgress>> {
  return call({ method: "GET", url: `/library/resources/${encodeURIComponent(resourceId)}/progress`, params: { churchId } })
}

export async function updateLibraryResourceProgress(
  churchId: string,
  resourceId: string,
  input: { positionSeconds?: number; pageNumber?: number | null }
): Promise<Result<LibraryResourceProgress>> {
  return call({
    method: "PATCH",
    url: `/library/resources/${encodeURIComponent(resourceId)}/progress`,
    params: { churchId },
    data: input,
  })
}
