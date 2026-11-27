"use server"

// Server-side calls to the announcements API. The access token stays on the server (apiRequest reads the session).
// Every action returns { ok, data } or { ok: false, code }. Raw server text never reaches the browser;
// the editor turns `code` into a translated message (see rules.ts).

import { apiRequest, type ApiResponse } from "@/lib/api-client"
import type {
  AnnouncementDetail,
  AnnouncementInput,
  AnnouncementListItem,
  AttachmentInfo,
  AnnouncementStatus,
} from "./rules"

export type ActionResult<T> = { ok: true; data: T } | { ok: false; code: string }

export interface PublishResult {
  id: string
  status: AnnouncementStatus
}

export interface SignedUrl {
  url: string
  expiresIn: number
}

function errorCode(response: ApiResponse<unknown>): string {
  const nested = response.error as { code?: unknown } | undefined
  if (nested && typeof nested === "object" && typeof nested.code === "string" && nested.code !== "") {
    return nested.code
  }
  switch (response.statusCode) {
    case 400:
      return "VALIDATION"
    case 403:
      return "FORBIDDEN"
    case 404:
      return "NOT_FOUND"
    case 409:
    case 422:
      return "ANNOUNCEMENT_NOT_DRAFT"
    case 413:
      return "ATTACHMENT_TOO_LARGE"
    case 415:
      return "ATTACHMENT_TYPE"
    case 0:
      return "NETWORK"
    default:
      return "UNKNOWN"
  }
}

async function send<T>(
  method: "GET" | "POST" | "PATCH",
  url: string,
  data?: unknown,
): Promise<ActionResult<T>> {
  const response = await apiRequest<T>({ requestConfig: { method, url, data } })
  if (response.success && response.data !== undefined && response.data !== null) {
    return { ok: true, data: response.data }
  }
  return { ok: false, code: errorCode(response) }
}

export async function listAnnouncements(): Promise<ActionResult<{ items: AnnouncementListItem[] }>> {
  return send<{ items: AnnouncementListItem[] }>("GET", "/announcements")
}

export async function getAnnouncement(id: string): Promise<ActionResult<AnnouncementDetail>> {
  return send<AnnouncementDetail>("GET", `/announcements/${encodeURIComponent(id)}`)
}

export async function createAnnouncement(input: AnnouncementInput): Promise<ActionResult<AnnouncementDetail>> {
  return send<AnnouncementDetail>("POST", "/announcements", input)
}

export async function updateAnnouncement(
  id: string,
  input: AnnouncementInput,
): Promise<ActionResult<AnnouncementDetail>> {
  return send<AnnouncementDetail>("PATCH", `/announcements/${encodeURIComponent(id)}`, input)
}

export async function publishAnnouncement(id: string): Promise<ActionResult<PublishResult>> {
  return send<PublishResult>("POST", `/announcements/${encodeURIComponent(id)}/publish`)
}

export async function uploadAnnouncementAttachment(formData: FormData): Promise<ActionResult<AttachmentInfo>> {
  return send<AttachmentInfo>("POST", "/announcement-attachments", formData)
}

export async function getAnnouncementAttachmentUrl(id: string): Promise<ActionResult<SignedUrl>> {
  return send<SignedUrl>("GET", `/announcement-attachments/${encodeURIComponent(id)}/url`)
}
