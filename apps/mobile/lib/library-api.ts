import { api } from "./api"

// Typed clients for the library, progress, public church and notification endpoints.
// Shapes mirror apps/api file-upload, public and notifications services (envelope `data` is unwrapped by api.ts).

export type ResourceType = "document" | "book" | "sermon" | "audio" | "video"

export type LibraryResource = {
  id: string
  scope: "branch" | "network"
  branchId: string
  title: string
  description: string | null
  originalFileName: string
  contentType: string
  sizeBytes: number
  resourceType: ResourceType
  language: string | null
  authorSpeaker: string | null
  categories: string[]
  durationSeconds: number | null
  pageCount: number | null
  publicationStatus: string
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export type LibraryResourcePage = { items: LibraryResource[]; nextCursor: string | null }
export type ResourceAccess = { url: string; expiresAt: string }
export type ResourceProgress = { resourceId: string; positionSeconds: number; pageNumber: number | null; updatedAt: string }

export type PublicChurchSummary = {
  publicId: string
  name: string
  location: string | null
  about: string | null
  imageUrl: string | null
}
export type PublicChurchPage = {
  items: PublicChurchSummary[]
  pagination: { limit: number; offset: number; hasNext: boolean }
}

export type NotificationItem = {
  id: string
  churchId: string | null
  type: string
  templateKey: string
  templateData: Record<string, unknown>
  target: { type: string; params: Record<string, unknown> } | null
  createdAt: string
  readAt: string | null
}
export type NotificationPage = { items: NotificationItem[]; unreadCount: number; nextCursor: string | null }

function query(params: Record<string, string | number | boolean | undefined | null>) {
  const search = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "" && value !== false)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&")
  return search ? `?${search}` : ""
}

export const libraryApi = {
  list: (params: { cursor?: string | null; query?: string; resourceType?: ResourceType; limit?: number } = {}) =>
    api.get<LibraryResourcePage>(`/library/resources${query({ cursor: params.cursor, query: params.query, resourceType: params.resourceType, limit: params.limit ?? 20 })}`),
  detail: (id: string) => api.get<LibraryResource>(`/library/resources/${encodeURIComponent(id)}`),
  // Returns a short-lived URL. The caller opens it with the device browser (DEC-15), never a WebView.
  access: (id: string) => api.post<ResourceAccess>(`/library/resources/${encodeURIComponent(id)}/access`),
  progress: (id: string) => api.get<ResourceProgress>(`/library/resources/${encodeURIComponent(id)}/progress`),
  saveProgress: (id: string, body: { positionSeconds?: number; pageNumber?: number | null }) =>
    api.patch<ResourceProgress>(`/library/resources/${encodeURIComponent(id)}/progress`, body),
}

export const publicChurchesApi = {
  list: (params: { offset?: number; query?: string; limit?: number } = {}) =>
    api.get<PublicChurchPage>(`/public/churches${query({ offset: params.offset, query: params.query, limit: params.limit ?? 20 })}`),
}

export const notificationsApi = {
  list: (params: { cursor?: string | null; unread?: boolean; limit?: number } = {}) =>
    api.get<NotificationPage>(`/notifications${query({ cursor: params.cursor, unread: params.unread, limit: params.limit ?? 20 })}`),
  markRead: (id: string) => api.patch<NotificationItem>(`/notifications/${encodeURIComponent(id)}/read`),
  markAllRead: () => api.patch<{ markedCount: number }>("/notifications/read-all"),
}
