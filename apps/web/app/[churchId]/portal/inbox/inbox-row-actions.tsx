"use client"

import { useState, useTransition } from "react"

import { markAllNotificationsRead, markNotificationRead } from "@/actions/notifications"
import { useT } from "@/components/i18n/locale-provider"
import { Button } from "@/components/ui/button"

// Without notificationId: the page-level "mark all as read" control. With it: a per-item mark-read.
export function InboxRowActions({
  churchId,
  notificationId,
  unreadCount,
}: {
  churchId: string
  notificationId?: string
  unreadCount?: number
}) {
  const { t } = useT()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function run(action: () => Promise<{ status: "ok" } | { status: "unavailable"; message: string }>) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (result.status === "unavailable") setError(result.message)
    })
  }

  if (notificationId) {
    return (
      <>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => run(() => markNotificationRead(churchId, notificationId))}
        >
          {t("wiring.inbox.markRead")}
        </Button>
        {error ? <p role="alert" className="text-destructive mt-2 text-sm">{error}</p> : null}
      </>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={pending || !unreadCount}
        onClick={() => run(() => markAllNotificationsRead(churchId))}
      >
        {t("wiring.inbox.markAllRead")}
      </Button>
      {error ? <p role="alert" className="text-destructive text-sm">{error}</p> : null}
    </div>
  )
}
