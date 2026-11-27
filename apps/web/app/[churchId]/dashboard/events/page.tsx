import React from "react"
import Link from "next/link"
import { format, startOfMonth, endOfMonth } from "date-fns"

import { getEvents } from "@/actions/event"
import { getServiceSessions } from "@/actions/attendance"
import { ensurePermission } from "@/lib/permissions-server"
import { getLocale, getTranslator } from "@/lib/i18n/server"
import { formatLocaleDate, type Locale } from "@church/config"
import type { Translate } from "@church/config"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { EventCalendarGrid } from "@/components/event/event-calendar-grid"
import { UnavailableState } from "@/components/ui/unavailable-state"
import { loadOrUnavailable, type LoadResult } from "@/lib/load-or-unavailable"

interface PageProps {
  params: Promise<{ churchId: string }>
  searchParams: Promise<{ date?: string; month?: string }>
}

function eventStatusLabel(t: Translate, status: string): string {
  if (status === "draft") return t("staff.events.status.draft")
  if (status === "published") return t("staff.events.status.published")
  if (status === "cancelled") return t("staff.events.status.cancelled")
  return status
}

function formatTime(value: string | null | undefined, locale: Locale): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return formatLocaleDate(date, locale, { hour: "numeric", minute: "2-digit" })
}

async function DayAgenda({
  churchId,
  selectedDate,
  eventsPromise,
  sessionsPromise,
}: {
  churchId: string
  selectedDate: string
  eventsPromise: Promise<any[]>
  sessionsPromise: Promise<LoadResult<any[]>>
}) {
  const t = await getTranslator()
  const locale = await getLocale()
  const [events, sessionsResult] = await Promise.all([eventsPromise, sessionsPromise])
  const sessionsOk = sessionsResult.status === "ok"
  const sessions = sessionsResult.status === "ok" ? sessionsResult.data : []
  const unavailable = <UnavailableState title={t("staff.common.unavailableTitle")} message={t("staff.common.unavailableMessage")} />

  const dayEvents = events.filter((e) => String(e.startsAt).slice(0, 10) === selectedDate)
  // Read-only merge: service sessions are rendered alongside events for
  // planning visibility only, never as an editable/clickable entity here.
  const daySessions = sessions.filter((s) => String(s.sessionDate).slice(0, 10) === selectedDate)

  if (dayEvents.length === 0 && daySessions.length === 0) {
    return sessionsOk ? <p className="text-sm text-muted-foreground">{t("staff.events.agenda.empty")}</p> : unavailable
  }

  return (
    <>
    <ul className="space-y-2">
      {dayEvents.map((event) => (
        <li key={event.id}>
          <Link
            href={`/${churchId}/dashboard/events/${event.id}`}
            className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-accent"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{event.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatTime(event.startsAt, locale)}
                {event.location ? ` · ${event.location}` : ""}
              </p>
            </div>
            <Badge variant={event.status === "cancelled" ? "destructive" : "secondary"} className="capitalize">
              {eventStatusLabel(t, event.status)}
            </Badge>
          </Link>
        </li>
      ))}
      {daySessions.map((session) => (
        <li
          key={session.id}
          className="flex items-center justify-between rounded-md border border-dashed border-muted-foreground/40 bg-muted/30 p-3"
        >
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {session.title || t("staff.sessions.fallbackName")}
            </p>
            <p className="text-xs text-muted-foreground">{t("staff.events.agenda.serviceNote")}</p>
          </div>
          <Badge variant="outline">{t("staff.events.agenda.serviceBadge")}</Badge>
        </li>
      ))}
    </ul>
    {!sessionsOk && unavailable}
    </>
  )
}

export default async function EventsCalendarPage({ params, searchParams }: PageProps) {
  await ensurePermission("view:events")
  const t = await getTranslator()
  const locale = await getLocale()
  const { churchId } = await params
  const { date, month } = await searchParams

  const today = format(new Date(), "yyyy-MM-dd")
  const selectedDate = date || today
  const visibleMonth = month || selectedDate.slice(0, 7)

  const monthAnchor = new Date(`${visibleMonth}-01T00:00:00`)
  const from = format(startOfMonth(monthAnchor), "yyyy-MM-dd")
  const to = format(endOfMonth(monthAnchor), "yyyy-MM-dd")

  const eventsPromise = getEvents(churchId, { from, to })
  const sessionsPromise = loadOrUnavailable(() => getServiceSessions(churchId, from, to))
    .then((result) => (result.status === "ok" && Array.isArray(result.data) ? result : { status: "unavailable" as const }))

  const events = await eventsPromise
  const eventDates = Array.from(new Set(events.map((e) => String(e.startsAt).slice(0, 10))))
  const sessionsResult = await sessionsPromise
  const sessions: any[] = sessionsResult.status === "ok" ? sessionsResult.data : []
  const serviceDates = Array.from(new Set(sessions.map((s: any) => String(s.sessionDate).slice(0, 10))))

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("staff.events.calendarTitle")}</h2>
          <p className="text-muted-foreground">{t("staff.events.calendarDescription")}</p>
        </div>
        <Link href={`/${churchId}/dashboard/events/add`}>
          <Button>{t("staff.events.create")}</Button>
        </Link>
      </div>
      <Separator />

      <div className="grid gap-6 md:grid-cols-2">
        <EventCalendarGrid
          selectedDate={selectedDate}
          visibleMonth={visibleMonth}
          eventDates={eventDates}
          serviceDates={serviceDates}
        />

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            {format(new Date(`${selectedDate}T00:00:00`), "EEEE, MMMM d, yyyy")}
          </h3>
          <React.Suspense fallback={<Skeleton className="h-40 w-full" />}>
            <DayAgenda
              churchId={churchId}
              selectedDate={selectedDate}
              eventsPromise={eventsPromise}
              sessionsPromise={sessionsPromise}
            />
          </React.Suspense>
        </div>
      </div>
    </div>
  )
}
