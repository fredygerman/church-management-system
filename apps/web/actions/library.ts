"use server"

import { revalidatePath } from "next/cache"
import { apiRequest } from "@/lib/api-client"
import { getTranslator } from "@/lib/i18n/server"

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
  const t = await getTranslator()
  try {
    const response = await apiRequest<LibraryDocumentsPayload | LibraryDocument[]>({
      requestConfig: {
        method: "GET",
        url: "/api/files/library",
        params: { churchId },
      },
    })

    if (!response.success) {
      return {
        status: "unavailable",
        message: t("final.libraryAction.loadFailed"),
      }
    }

    const payload = response.data
    const documents = Array.isArray(payload) ? payload : payload?.documents

    if (!Array.isArray(documents)) {
      return {
        status: "unavailable",
        message: t("final.libraryAction.loadFailed"),
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
      message: t("final.libraryAction.loadFailed"),
    }
  }
}

export async function getLibraryDownloadUrl(
  churchId: string,
  documentId: string
): Promise<DownloadUrlResult> {
  const t = await getTranslator()
  try {
    const response = await apiRequest<DownloadUrlPayload>({
      requestConfig: {
        method: "GET",
        url: `/api/files/library/${documentId}/download-url`,
        params: { churchId },
      },
    })

    if (!response.success || !response.data?.url) {
      return {
        status: "unavailable",
        message: t("final.libraryAction.gone"),
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
      message: t("final.libraryAction.gone"),
    }
  }
}

// Staff upload: POST /api/files/upload (multipart, requires manage:files).
// Visibility is set at upload time through the metadata JSON; setStaffDocumentVisibility changes it later.
export async function uploadStaffDocument(churchId: string, formData: FormData): Promise<void> {
  const t = await getTranslator()
  const file = formData.get("file")
  const title = String(formData.get("title") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()

  if (!(file instanceof File) || file.size === 0) {
    throw new Error(t("final.libraryAction.chooseFile"))
  }
  if (!title) {
    throw new Error(t("final.libraryAction.enterTitle"))
  }

  const body = new FormData()
  body.append("file", file)
  body.append("name", title)
  body.append("displayName", title)
  body.append(
    "metadata",
    JSON.stringify({
      description: description || undefined,
      visibleToMembers: formData.get("visibleToMembers") === "on",
    })
  )

  const response = await apiRequest<unknown>({
    requestConfig: {
      method: "POST",
      url: "/api/files/upload",
      params: { churchId },
      data: body,
    },
  })

  if (!response.success) {
    throw new Error(response.message || t("final.libraryAction.uploadFailed"))
  }

  revalidatePath(`/${churchId}/dashboard/content`)
}

// Staff delete: DELETE /api/files/:id is a soft delete (requires manage:files).
export async function deleteStaffDocument(churchId: string, documentId: string): Promise<void> {
  const t = await getTranslator()
  const response = await apiRequest<unknown>({
    requestConfig: {
      method: "DELETE",
      url: `/api/files/${encodeURIComponent(documentId)}`,
      params: { churchId },
    },
  })

  if (!response.success) {
    throw new Error(response.message || t("final.libraryAction.deleteFailed"))
  }

  revalidatePath(`/${churchId}/dashboard/content`)
}

// Staff visibility: PATCH /api/files/:id with { visibleToMembers } (requires manage:files).
export async function setStaffDocumentVisibility(
  churchId: string,
  documentId: string,
  visibleToMembers: boolean
): Promise<void> {
  const t = await getTranslator()
  const response = await apiRequest<unknown>({
    requestConfig: {
      method: "PATCH",
      url: `/api/files/${encodeURIComponent(documentId)}`,
      params: { churchId },
      data: { visibleToMembers },
    },
  })

  if (!response.success) {
    throw new Error(response.message || t("final.libraryAction.visibilityFailed"))
  }

  revalidatePath(`/${churchId}/dashboard/content`)
}
