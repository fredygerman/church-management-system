import Link from "next/link"

import { listNotifications, type InboxNotification } from "@/actions/notifications"
import { Button } from "@/components/ui/button"
import { getTranslator } from "@/lib/i18n/server"
import { dictionaries, type MessageKey } from "@church/config"
import { InboxRowActions } from "./inbox-row-actions"

interface PageProps {
  params: Promise<{ churchId: string }>
  searchParams: Promise<{ filter?: string; cursor?: string }>
}

export default async function PortalInboxPage({ params, searchParams }: PageProps) {
  const { churchId } = await params
  const { filter, cursor } = await searchParams
  const t = await getTranslator()
  const unreadOnly = filter === "unread"
  const base = `/${churchId}/portal/inbox`
  const result = await listNotifications({ cursor: cursor || null, unreadOnly })

  // Template keys are localized when they exist in the dictionary; otherwise a generic label.
  const titleFor = (item: InboxNotification) =>
    item.templateKey in dictionaries.en ? t(item.templateKey as MessageKey) : t("wiring.inbox.genericTitle")

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-foreground text-2xl font-semibold">{t("wiring.inbox.title")}</h1>
        <nav className="flex gap-2" aria-label={t("wiring.inbox.title")}>
          <Button asChild variant={unreadOnly ? "outline" : "secondary"}>
            <Link href={base} aria-current={unreadOnly ? undefined : "page"}>{t("wiring.inbox.all")}</Link>
          </Button>
          <Button asChild variant={unreadOnly ? "secondary" : "outline"}>
            <Link href={`${base}?filter=unread`} aria-current={unreadOnly ? "page" : undefined}>
              {t("wiring.inbox.unread")}
            </Link>
          </Button>
        </nav>
      </div>

      {result.status === "unavailable" ? (
        <div className="border-destructive/50 bg-card rounded-lg border p-5">
          <p className="text-destructive text-sm">{result.message}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href={base}>{t("wiring.common.retry")}</Link>
          </Button>
        </div>
      ) : (
        <>
          <InboxRowActions churchId={churchId} unreadCount={result.data.unreadCount} />
          {result.data.items.length === 0 ? (
            <p className="border-border bg-card text-muted-foreground rounded-lg border p-5 text-sm">
              {t("wiring.inbox.empty")}
            </p>
          ) : (
            <ul className="space-y-3">
              {result.data.items.map((item) => (
                <li key={item.id} className="border-border bg-card rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-foreground font-medium">
                        {item.readAt == null ? <span className="sr-only">{t("wiring.inbox.unreadMarker")}: </span> : null}
                        {titleFor(item)}
                      </p>
                      <time className="text-muted-foreground text-xs" dateTime={item.createdAt}>
                        {new Date(item.createdAt).toLocaleString()}
                      </time>
                    </div>
                    {item.readAt == null ? (
                      <span aria-hidden="true" className="bg-primary mt-2 size-2 shrink-0 rounded-full" />
                    ) : null}
                  </div>
                  {item.readAt == null ? (
                    <div className="mt-3">
                      <InboxRowActions churchId={churchId} notificationId={item.id} />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {result.data.nextCursor ? (
            <Button asChild variant="outline">
              <Link href={`${base}?${new URLSearchParams({ ...(unreadOnly ? { filter: "unread" } : {}), cursor: result.data.nextCursor }).toString()}`}>
                {t("wiring.inbox.loadMore")}
              </Link>
            </Button>
          ) : null}
        </>
      )}
    </div>
  )
}
