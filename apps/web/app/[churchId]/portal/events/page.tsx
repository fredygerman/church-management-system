import { Suspense } from "react"
import Link from "next/link"
import { format } from "date-fns"

import { apiGet } from "@/lib/api-helpers"
import { getLocale, getTranslator } from "@/lib/i18n/server"
import { formatLocaleDate, type Locale } from "@church/config"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EventRsvp } from "@/components/portal/event-rsvp"
import { PortalDeniedState, isForbiddenError } from "@/components/portal/portal-denied-state"

interface PageProps {
  params: Promise<{ churchId: string }>
}

function formatDateTime(value: string | null | undefined, dateNotSet: string, locale: Locale): string {
  if (!value) return dateNotSet
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return formatLocaleDate(date, locale, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}

function EventsLoading() {
  return (
    <div className="border-border bg-card h-48 animate-pulse rounded-lg border" />
  )
}

async function EventsContent({ churchId }: { churchId: string }) {
  const t = await getTranslator()
  const locale = await getLocale()
  try {
    const today = format(new Date(), "yyyy-MM-dd")
    const [events, myRsvps] = await Promise.all([
      apiGet<any[]>("/events", { churchId, from: today }),
      apiGet<any[]>("/events/me", { churchId }),
    ])
    const eventList = Array.isArray(events) ? events : []
    const rsvpList = Array.isArray(myRsvps) ? myRsvps : []
    const rsvpByEventId = new Map(
      rsvpList.map((rsvp: any) => [rsvp.eventId ?? rsvp.event?.id, rsvp.status])
    )

    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">{t("portal.events.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("portal.events.subtitle")}
          </p>
        </div>
        {eventList.length === 0 ? (
          <div className="border-border bg-card rounded-lg border p-5">
            <p className="text-muted-foreground text-sm">
              {t("portal.events.empty")}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {eventList.map((event: any) => {
              const eventName = event.title || t("portal.events.untitled")
              const isClosed =
                event.status === "full" || event.status === "closed"
              return (
                <li
                  key={event.id}
                  className="border-border bg-card rounded-lg border p-5"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-foreground text-base font-semibold">
                        {eventName}
                      </h2>
                      <p className="text-muted-foreground text-xs">
                        {formatDateTime(event.startsAt, t("portal.events.dateNotSet"), locale)}
                        {event.endsAt
                          ? ` – ${formatDateTime(event.endsAt, t("portal.events.dateNotSet"), locale)}`
                          : ""}
                      </p>
                      {event.location && (
                        <p className="text-muted-foreground text-xs">
                          {event.location}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {event.status === "cancelled" && (
                        <Badge variant="destructive">{t("portal.events.status.cancelled")}</Badge>
                      )}
                      {isClosed && (
                        <Badge variant="secondary">
                          {event.status === "full"
                            ? t("portal.events.status.full")
                            : t("portal.events.status.closed")}
                        </Badge>
                      )}
                      {event.scope === "network" && (
                        <Badge variant="outline">{t("portal.events.scope.network")}</Badge>
                      )}
                    </div>
                  </div>
                  {event.description && (
                    <p className="text-muted-foreground mb-3 text-sm">
                      {event.description}
                    </p>
                  )}
                  {isClosed && event.message && (
                    <p
                      className="text-muted-foreground mb-3 text-sm"
                      role="status"
                    >
                      {event.message}
                    </p>
                  )}
                  {event.status !== "cancelled" && !isClosed && (
                    <EventRsvp
                      churchId={churchId}
                      eventId={event.id}
                      eventName={eventName}
                      currentStatus={rsvpByEventId.get(event.id) ?? null}
                    />
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    )
  } catch (error) {
    if (isForbiddenError(error)) {
      return <PortalDeniedState title={t("portal.events.title")} />
    }
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">{t("portal.events.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("portal.events.loadError")}
          </p>
        </div>
        <div className="border-destructive/50 bg-card rounded-lg border p-5">
          <p className="text-destructive text-sm">{t("portal.events.tryAgain")}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href={`/${churchId}/portal/events`}>{t("common.retry")}</Link>
          </Button>
        </div>
      </div>
    )
  }
}

export default async function PortalEventsPage({ params }: PageProps) {
  const { churchId } = await params
  return (
    <Suspense fallback={<EventsLoading />}>
      <EventsContent churchId={churchId} />
    </Suspense>
  )
}
