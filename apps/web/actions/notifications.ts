"use server"

import { revalidatePath } from "next/cache"
import { apiRequest } from "@/lib/api-client"
import { getTranslator } from "@/lib/i18n/server"

export interface InboxNotification {
  id: string
  churchId: string | null
  type: string
  templateKey: string
  templateData: Record<string, unknown>
  target: { type: string; params: Record<string, unknown> } | null
  createdAt: string
  readAt: string | null
}

export interface InboxPage {
  items: InboxNotification[]
  unreadCount: number
  nextCursor: string | null
}

type Result<T> = { status: "ok"; data: T } | { status: "unavailable"; message: string }

function isNextRedirect(error: unknown): boolean {
  return error instanceof Error && error.message.includes("NEXT_REDIRECT")
}

export async function listNotifications(
  input: { cursor?: string | null; unreadOnly?: boolean } = {}
): Promise<Result<InboxPage>> {
  const t = await getTranslator()
  try {
    const response = await apiRequest<InboxPage>({
      requestConfig: {
        method: "GET",
        url: "/notifications",
        params: {
          cursor: input.cursor ?? undefined,
          unread: input.unreadOnly ? "true" : undefined,
        },
      },
    })
    if (!response.success || !response.data) {
      return { status: "unavailable", message: t("wiring.common.loadFailed") }
    }
    return { status: "ok", data: response.data }
  } catch (error) {
    if (isNextRedirect(error)) throw error
    console.error("Error loading notifications:", error)
    return { status: "unavailable", message: t("wiring.common.loadFailed") }
  }
}

// Idempotent on the server; safe to retry.
export async function markNotificationRead(
  churchId: string,
  notificationId: string
): Promise<Result<InboxNotification>> {
  const t = await getTranslator()
  try {
    const response = await apiRequest<InboxNotification>({
      requestConfig: {
        method: "PATCH",
        url: `/notifications/${encodeURIComponent(notificationId)}/read`,
      },
    })
    if (!response.success || !response.data) {
      return { status: "unavailable", message: t("wiring.common.actionFailed") }
    }
    revalidatePath(`/${churchId}/portal/inbox`)
    return { status: "ok", data: response.data }
  } catch (error) {
    if (isNextRedirect(error)) throw error
    console.error("Error marking notification read:", error)
    return { status: "unavailable", message: t("wiring.common.actionFailed") }
  }
}

export async function markAllNotificationsRead(churchId: string): Promise<Result<{ markedCount: number }>> {
  const t = await getTranslator()
  try {
    const response = await apiRequest<{ markedCount: number }>({
      requestConfig: { method: "PATCH", url: "/notifications/read-all" },
    })
    if (!response.success || !response.data) {
      return { status: "unavailable", message: t("wiring.common.actionFailed") }
    }
    revalidatePath(`/${churchId}/portal/inbox`)
    return { status: "ok", data: response.data }
  } catch (error) {
    if (isNextRedirect(error)) throw error
    console.error("Error marking all notifications read:", error)
    return { status: "unavailable", message: t("wiring.common.actionFailed") }
  }
}
