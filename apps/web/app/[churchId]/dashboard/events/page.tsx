import React from "react"
import Link from "next/link"
import { format, startOfMonth, endOfMonth } from "date-fns"

import { getEvents } from "@/actions/event"
import { getServiceSessions } from "@/actions/attendance"
import { ensurePermission } from "@/lib/permissions-server"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { EventCalendarGrid } from "@/components/event/event-calendar-grid"

interface PageProps {
  params: Promise<{ churchId: string }>
  searchParams: Promise<{ date?: string; month?: string }>
}

function formatTime(value: string | null | undefined): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
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
  sessionsPromise: Promise<any[]>
}) {
  const [events, sessions] = await Promise.all([eventsPromise, sessionsPromise])

  const dayEvents = events.filter((e) => String(e.startsAt).slice(0, 10) === selectedDate)
  // Read-only merge: service sessions are rendered alongside events for
  // planning visibility only, never as an editable/clickable entity here.
  const daySessions = sessions.filter((s) => String(s.sessionDate).slice(0, 10) === selectedDate)

  if (dayEvents.length === 0 && daySessions.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing scheduled for this day.</p>
  }

  return (
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
                {formatTime(event.startsAt)}
                {event.location ? ` · ${event.location}` : ""}
              </p>
            </div>
            <Badge variant={event.status === "cancelled" ? "destructive" : "secondary"} className="capitalize">
              {event.status}
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
              {session.title || "Service Session"}
            </p>
            <p className="text-xs text-muted-foreground">Recurring service — not an event</p>
          </div>
          <Badge variant="outline">Service</Badge>
        </li>
      ))}
    </ul>
  )
}

export default async function EventsCalendarPage({ params, searchParams }: PageProps) {
  await ensurePermission("view:events")
  const { churchId } = await params
  const { date, month } = await searchParams

  const today = format(new Date(), "yyyy-MM-dd")
  const selectedDate = date || today
  const visibleMonth = month || selectedDate.slice(0, 7)

  const monthAnchor = new Date(`${visibleMonth}-01T00:00:00`)
  const from = format(startOfMonth(monthAnchor), "yyyy-MM-dd")
  const to = format(endOfMonth(monthAnchor), "yyyy-MM-dd")

  const eventsPromise = getEvents(churchId, { from, to })
  const sessionsPromise = getServiceSessions(churchId, from, to)
    .then((result) => (Array.isArray(result) ? result : []))
    .catch(() => [])

  const events = await eventsPromise
  const eventDates = Array.from(new Set(events.map((e) => String(e.startsAt).slice(0, 10))))
  const sessions = await sessionsPromise
  const serviceDates = Array.from(new Set(sessions.map((s: any) => String(s.sessionDate).slice(0, 10))))

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Events Calendar</h2>
          <p className="text-muted-foreground">
            Camp meetings, seminars and socials. Service sessions are shown for reference only.
          </p>
        </div>
        <Link href={`/${churchId}/dashboard/events/add`}>
          <Button>Create Event</Button>
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
