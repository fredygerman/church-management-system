"use server"

import { apiRequest } from "@/lib/api-client"
import { isSafeHttpsUrl, isValidAttachmentId } from "@/lib/announcements/doc-view-model"

// Signed attachment URL for the browser. The URL lives only in client React state:
// it is not logged, not stored, and not written into the page HTML beyond the render.
export type AttachmentUrlResult = { status: "ok"; url: string } | { status: "unavailable" }

const CHURCH_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/

export async function getAnnouncementAttachmentUrl(
  churchId: string,
  attachmentId: string
): Promise<AttachmentUrlResult> {
  if (typeof churchId !== "string" || !CHURCH_ID_PATTERN.test(churchId)) return { status: "unavailable" }
  if (!isValidAttachmentId(attachmentId)) return { status: "unavailable" }

  try {
    const response = await apiRequest<{ url?: unknown; expiresIn?: unknown }>({
      requestConfig: {
        method: "GET",
        url: `/announcement-attachments/${encodeURIComponent(attachmentId)}/url`,
        params: { churchId },
      },
    })
    const url = response.success ? response.data?.url : undefined
    if (!isSafeHttpsUrl(url)) return { status: "unavailable" }
    return { status: "ok", url }
  } catch (error) {
    const digest = (error as { digest?: unknown } | null)?.digest
    if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) throw error
    return { status: "unavailable" }
  }
}
