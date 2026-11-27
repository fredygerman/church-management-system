import type { MessageKey } from "@church/config/i18n"
import { API_BASE_URL } from "../../config/api"
import { api } from "../../lib/api"
import { getStoredTokens } from "../../lib/storage"

// Mirrors the API limits (JPEG, PNG, WebP; 5 MB). The server checks the file signature again.
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024
export type AvatarMime = "image/jpeg" | "image/png" | "image/webp"

const EXTENSION_TO_MIME: Record<string, AvatarMime> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" }
const MIME_TO_EXTENSION: Record<AvatarMime, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }

// Error codes the API returns for avatar requests. Anything else is treated as a generic failure.
const KNOWN_CODES: readonly string[] = ["AVATAR_MISSING_FILE", "AVATAR_TOO_LARGE", "AVATAR_TYPE_UNSUPPORTED", "AVATAR_IMAGE_INVALID", "AVATAR_DECODE_FAILED"]

/** The subset of an image-picker asset this module needs. */
export type AvatarAsset = { uri: string; mimeType?: string | null; fileName?: string | null; fileSize?: number | null }

export type AvatarUpload = { avatarUrl: string | null; avatarUpdatedAt: string | null }

/** Carries the API error code only; raw server text is never shown to the member. */
export class AvatarError extends Error {
  readonly code: string
  readonly status?: number

  constructor(code: string, status?: number) {
    super(code)
    this.name = "AvatarError"
    this.code = code
    this.status = status
  }
}

/** The MIME type to send: the picker's declared type, or the file extension when none is given. Null when unsupported. */
export function mimeForAsset(asset: AvatarAsset): AvatarMime | null {
  const declared = asset.mimeType?.trim().toLowerCase()
  if (declared) {
    if (declared === "image/jpg") return "image/jpeg"
    return declared === "image/jpeg" || declared === "image/png" || declared === "image/webp" ? declared : null
  }
  const source = (asset.fileName ?? asset.uri).split(/[?#]/)[0] ?? ""
  const extension = source.includes(".") ? source.split(".").pop()?.toLowerCase() ?? "" : ""
  return EXTENSION_TO_MIME[extension] ?? null
}

/** Maps a failure to the message key to show. Only the action (upload or remove) decides the generic text. */
export function messageKeyFor(error: unknown, action: "upload" | "remove"): MessageKey {
  const code = error instanceof AvatarError ? error.code : ""
  switch (code) {
    case "AVATAR_MISSING_FILE": return "profile.avatar.missingFile"
    case "AVATAR_TOO_LARGE": return "profile.avatar.tooLarge"
    case "AVATAR_TYPE_UNSUPPORTED": return "profile.avatar.typeUnsupported"
    case "AVATAR_IMAGE_INVALID":
    case "AVATAR_DECODE_FAILED": return "profile.avatar.decodeFailed"
    default: return action === "remove" ? "profile.avatar.removeFailed" : "profile.avatar.uploadFailed"
  }
}

function baseUrl(): string {
  if (!API_BASE_URL) throw new AvatarError("NOT_CONFIGURED")
  return API_BASE_URL.replace(/\/$/, "")
}

async function send(path: string, method: "POST" | "DELETE", body?: FormData): Promise<Response> {
  const url = `${baseUrl()}${path}`
  let accessToken: string | undefined
  try {
    accessToken = (await getStoredTokens())?.accessToken
  } catch {
    throw new AvatarError("STORAGE")
  }
  const headers: Record<string, string> = { Accept: "application/json" }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  try {
    return await fetch(url, { body, headers, method })
  } catch {
    throw new AvatarError("NETWORK")
  }
}

// On 401, api.get("/users/me") refreshes an expired access token and stores the rotated pair (or ends the session).
// The request is then sent once more with the stored token.
async function authorized(path: string, method: "POST" | "DELETE", body?: FormData): Promise<Response> {
  const first = await send(path, method, body)
  if (first.status !== 401) return first
  await api.get("/users/me").catch(() => undefined)
  return send(path, method, body)
}

function codeFrom(body: unknown): string | undefined {
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {}
  const nested = record.error && typeof record.error === "object" ? (record.error as Record<string, unknown>).code : undefined
  for (const candidate of [record.code, nested, record.error, record.message]) {
    if (typeof candidate === "string" && KNOWN_CODES.includes(candidate)) return candidate
  }
  return undefined
}

async function failureFrom(response: Response): Promise<AvatarError> {
  let body: unknown
  try {
    body = await response.json()
  } catch {
    body = undefined
  }
  return new AvatarError(codeFrom(body) ?? (response.status === 401 ? "UNAUTHORIZED" : "HTTP"), response.status)
}

/** Sends the picked image as multipart field `file`. Throws AvatarError on any rejection. */
export async function uploadAvatar(asset: AvatarAsset): Promise<AvatarUpload> {
  const mimeType = mimeForAsset(asset)
  if (!mimeType) throw new AvatarError("AVATAR_TYPE_UNSUPPORTED")
  if (typeof asset.fileSize === "number" && asset.fileSize > AVATAR_MAX_BYTES) throw new AvatarError("AVATAR_TOO_LARGE")

  const form = new FormData()
  const name = asset.fileName?.trim() || `avatar.${MIME_TO_EXTENSION[mimeType]}`
  // React Native's FormData accepts a { uri, name, type } file part; the DOM typings do not describe it.
  form.append("file", { uri: asset.uri, name, type: mimeType } as unknown as Blob)

  const response = await authorized("/users/me/avatar", "POST", form)
  if (!response.ok) throw await failureFrom(response)

  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new AvatarError("MALFORMED", response.status)
  }
  const data = (body && typeof body === "object" && "data" in body ? (body as { data: unknown }).data : undefined) as Record<string, unknown> | undefined
  if (!data || typeof data !== "object") throw new AvatarError("MALFORMED", response.status)
  return {
    avatarUrl: typeof data.avatarUrl === "string" ? data.avatarUrl : null,
    avatarUpdatedAt: typeof data.avatarUpdatedAt === "string" ? data.avatarUpdatedAt : null,
  }
}

/** Removes the member's photo (204). Throws AvatarError on any rejection. */
export async function removeAvatar(): Promise<void> {
  const response = await authorized("/users/me/avatar", "DELETE")
  if (!response.ok) throw await failureFrom(response)
}
