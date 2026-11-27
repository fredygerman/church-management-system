// Shared types and pure rules for the announcement editor: upload limits, status labels, error codes and field checks.
// Type-only imports here, so this file runs under node tests and never pulls React in.
import type { MessageKey } from "@church/config"
import type { DocV1 } from "@/lib/announcements/doc"

export type AnnouncementStatus = "draft" | "pending_approval" | "scheduled" | "published" | "cancelled"
export type AttachmentKind = "image" | "file"

export interface AnnouncementListItem {
  id: string
  title: string
  summary: string | null
  status: AnnouncementStatus
  publishedAt: string | null
  createdAt: string
}

export interface AnnouncementDetail extends AnnouncementListItem {
  body: DocV1
  channels: string[]
}

export interface AnnouncementInput {
  title: string
  summary: string | null
  body: DocV1
  channels: ["in_app"]
}

export interface AttachmentInfo {
  id: string
  kind: AttachmentKind
  name: string
  contentType: string
  size: number
}

export const TITLE_MAX = 200
export const SUMMARY_MAX = 300

const MB = 1024 * 1024
export const IMAGE_MAX_BYTES = 8 * MB
export const FILE_MAX_BYTES = 10 * MB
export const IMAGE_TYPES: readonly string[] = ["image/jpeg", "image/png", "image/webp"]
export const FILE_TYPES: readonly string[] = ["application/pdf"]

export type AttachmentProblem = "imageType" | "imageSize" | "fileType" | "fileSize"

/** Checks a chosen file before upload. Returns null when it is allowed. */
export function attachmentProblem(kind: AttachmentKind, file: { type: string; size: number }): AttachmentProblem | null {
  if (kind === "image") {
    if (!IMAGE_TYPES.includes(file.type)) return "imageType"
    if (file.size > IMAGE_MAX_BYTES) return "imageSize"
    return null
  }
  if (!FILE_TYPES.includes(file.type)) return "fileType"
  if (file.size > FILE_MAX_BYTES) return "fileSize"
  return null
}

const ATTACHMENT_PROBLEM_KEYS: Record<AttachmentProblem, MessageKey> = {
  imageType: "announcements.attach.imageType",
  imageSize: "announcements.attach.imageSize",
  fileType: "announcements.attach.fileType",
  fileSize: "announcements.attach.fileSize",
}

export function attachmentProblemKey(problem: AttachmentProblem): MessageKey {
  return ATTACHMENT_PROBLEM_KEYS[problem]
}

export const STATUS_KEYS: Record<AnnouncementStatus, MessageKey> = {
  draft: "announcements.status.draft",
  pending_approval: "announcements.status.pending_approval",
  scheduled: "announcements.status.scheduled",
  published: "announcements.status.published",
  cancelled: "announcements.status.cancelled",
}

export type FallbackScope = "generic" | "attachmentFailed" | "loadFailed"

const FALLBACK_KEYS: Record<FallbackScope, MessageKey> = {
  generic: "announcements.error.generic",
  attachmentFailed: "announcements.error.attachmentFailed",
  loadFailed: "announcements.error.loadFailed",
}

// Codes from the API (or the status fallbacks in actions.ts) to a translated message.
const CODE_KEYS: Record<string, MessageKey> = {
  NOT_FOUND: "announcements.error.notFound",
  FORBIDDEN: "announcements.error.forbidden",
  VALIDATION: "announcements.error.validation",
  VALIDATION_FAILED: "announcements.error.validation",
  ANNOUNCEMENT_NOT_DRAFT: "announcements.error.notDraft",
  ATTACHMENT_TOO_LARGE: "announcements.attach.fileSize",
  ATTACHMENT_TYPE: "announcements.attach.fileType",
  NETWORK: "announcements.error.network",
}

/** Maps an API error code to a translated message key. Unknown codes use the fallback for that screen. */
export function announcementErrorKey(code: string | undefined, fallback: FallbackScope = "generic"): MessageKey {
  if (code && Object.prototype.hasOwnProperty.call(CODE_KEYS, code)) return CODE_KEYS[code]!
  return FALLBACK_KEYS[fallback]
}

/** Checks the title and summary before saving. Returns a message key, or null when they are fine. */
export function announcementFieldProblem(title: string, summary: string): MessageKey | null {
  const trimmedTitle = title.trim()
  if (trimmedTitle === "") return "announcements.validation.titleRequired"
  if (trimmedTitle.length > TITLE_MAX || summary.trim().length > SUMMARY_MAX) return "announcements.error.validation"
  return null
}

/** Turns an optional summary into the value the API expects: trimmed text, or null when empty. */
export function normalizeSummary(summary: string): string | null {
  const trimmed = summary.trim()
  return trimmed === "" ? null : trimmed
}
