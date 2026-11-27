import { api } from "../../lib/api"

// Signed links are short-lived (the API says 900 seconds). Refresh a little early so a link never expires mid-open.
const REFRESH_MARGIN_MS = 60 * 1000

export type SignedAttachmentUrl = { url: string; expiresIn: number }
export type AttachmentUrlCache = { load: (attachmentId: string) => Promise<string> }

/**
 * Resolves attachment ids to signed links and keeps them for one screen.
 * Concurrent requests for the same id share one call; a failed call is not cached, so a retry asks again.
 */
export function createAttachmentUrlCache(
  fetchSigned: (attachmentId: string) => Promise<SignedAttachmentUrl>,
  now: () => number = Date.now,
): AttachmentUrlCache {
  const ready = new Map<string, { url: string; expiresAt: number }>()
  const inFlight = new Map<string, Promise<string>>()

  return {
    load(attachmentId) {
      const cached = ready.get(attachmentId)
      if (cached && cached.expiresAt > now()) return Promise.resolve(cached.url)

      const pending = inFlight.get(attachmentId)
      if (pending) return pending

      const request = fetchSigned(attachmentId)
        .then((signed) => {
          if (!signed || typeof signed.url !== "string" || signed.url === "") throw new Error("Attachment link missing")
          const ttlMs = typeof signed.expiresIn === "number" && signed.expiresIn > 0 ? signed.expiresIn * 1000 : 0
          ready.set(attachmentId, { url: signed.url, expiresAt: now() + ttlMs - REFRESH_MARGIN_MS })
          return signed.url
        })
        .finally(() => {
          inFlight.delete(attachmentId)
        })
      inFlight.set(attachmentId, request)
      return request
    },
  }
}

/** Cache backed by the member API. Create one per screen so links are dropped when the screen closes. */
export function createAnnouncementAttachmentCache(): AttachmentUrlCache {
  return createAttachmentUrlCache((attachmentId) =>
    api.get<SignedAttachmentUrl>(`/announcement-attachments/${encodeURIComponent(attachmentId)}/url`),
  )
}
