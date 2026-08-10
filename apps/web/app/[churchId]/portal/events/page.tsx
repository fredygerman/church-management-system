import { format } from "date-fns"

import { getEvents, getMyEventRsvps } from "@/actions/event"
import { Badge } from "@/components/ui/badge"
import { RsvpButtons } from "@/components/event/rsvp-buttons"

interface PageProps {
  params: Promise<{ churchId: string }>
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}

export default async function PortalEventsPage({ params }: PageProps) {
  const { churchId } = await params

  const today = format(new Date(), "yyyy-MM-dd")
  const [events, myRsvps] = await Promise.all([
    getEvents(churchId, { from: today }),
    getMyEventRsvps(churchId),
  ])

  const rsvpByEventId = new Map(
    myRsvps.map((rsvp: any) => [rsvp.eventId ?? rsvp.event?.id, rsvp.status])
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Events</h1>
        <p className="text-sm text-muted-foreground">
          Upcoming camp meetings, seminars and socials — including network-wide events.
        </p>
      </div>

      {events.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">No upcoming events right now.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {events.map((event: any) => (
            <li key={event.id} className="rounded-lg border border-border bg-card p-5">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-foreground">{event.title}</h2>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(event.startsAt)}
                    {event.endsAt ? ` – ${formatDateTime(event.endsAt)}` : ""}
                  </p>
                  {event.location && (
                    <p className="text-xs text-muted-foreground">{event.location}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {event.status === "cancelled" && <Badge variant="destructive">Cancelled</Badge>}
                  {event.scope === "network" && <Badge variant="outline">Network</Badge>}
                </div>
              </div>

              {event.description && (
                <p className="mb-3 text-sm text-muted-foreground">{event.description}</p>
              )}

              {event.status !== "cancelled" && (
                <RsvpButtons
                  churchId={churchId}
                  eventId={event.id}
                  currentStatus={rsvpByEventId.get(event.id) ?? null}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
