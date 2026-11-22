"use server"

import { apiRequest } from "@/lib/api-client"

export interface LibraryDocument {
  id: string
  title: string
  description?: string | null
  original_file_name: string
  content_type: string
  size_bytes: number
  created_at: string
}

interface LibraryDocumentsPayload {
  documents?: LibraryDocument[]
}

interface DownloadUrlPayload {
  url: string
  expiresAt: string
}

type LibraryResult =
  | { status: "ok"; documents: LibraryDocument[] }
  | { status: "unavailable"; message: string }

type DownloadUrlResult =
  | { status: "ok"; url: string; expiresAt: string }
  | { status: "unavailable"; message: string }

function isNextRedirect(error: unknown): boolean {
  return error instanceof Error && error.message.includes("NEXT_REDIRECT")
}

export async function getLibraryDocuments(churchId: string): Promise<LibraryResult> {
  try {
    const response = await apiRequest<LibraryDocumentsPayload | LibraryDocument[]>({
      requestConfig: {
        method: "GET",
        url: "/files/library",
        params: { churchId },
      },
    })

    if (!response.success) {
      return {
        status: "unavailable",
        message: "We could not load the shared library. Please try again.",
      }
    }

    const payload = response.data
    const documents = Array.isArray(payload) ? payload : payload?.documents

    if (!Array.isArray(documents)) {
      return {
        status: "unavailable",
        message: "We could not load the shared library. Please try again.",
      }
    }

    return { status: "ok", documents }
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error
    }

    console.error("Error fetching library documents:", error)
    return {
      status: "unavailable",
      message: "We could not load the shared library. Please try again.",
    }
  }
}

export async function getLibraryDownloadUrl(
  churchId: string,
  documentId: string
): Promise<DownloadUrlResult> {
  try {
    const response = await apiRequest<DownloadUrlPayload>({
      requestConfig: {
        method: "GET",
        url: `/files/library/${documentId}/download-url`,
        params: { churchId },
      },
    })

    if (!response.success || !response.data?.url) {
      return {
        status: "unavailable",
        message: "This document is no longer available. Please refresh the page.",
      }
    }

    return {
      status: "ok",
      url: response.data.url,
      expiresAt: response.data.expiresAt,
    }
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error
    }

    console.error("Error creating library download URL:", error)
    return {
      status: "unavailable",
      message: "This document is no longer available. Please refresh the page.",
    }
  }
}
