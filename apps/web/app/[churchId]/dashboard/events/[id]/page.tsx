import Link from "next/link"
import { ensurePermission } from "@/lib/permissions-server"
import { getEventById, getEventRsvps } from "@/actions/event"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AttendanceForm } from "@/components/event/attendance-form"

interface PageProps {
  params: Promise<{ churchId: string; id: string }>
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}

function rosterName(row: any): string {
  return row.memberName || [row.firstName, row.lastName].filter(Boolean).join(" ") || row.memberId
}

const statusBadgeVariant: Record<string, "default" | "secondary" | "destructive"> = {
  published: "default",
  draft: "secondary",
  cancelled: "destructive",
}

export default async function EventDetailPage({ params }: PageProps) {
  await ensurePermission("manage:events")
  const { churchId, id } = await params

  const [event, roster] = await Promise.all([
    getEventById(churchId, id),
    getEventRsvps(churchId, id),
  ])

  const rsvps: any[] = Array.isArray(roster?.rows) ? roster.rows : []
  const counts = roster?.countsByStatus || { going: 0, maybe: 0, declined: 0 }
  const countsByChurch = (roster?.countsByChurch || {}) as Record<string, Record<string, number>>
  const byChurch = Object.entries(countsByChurch).map(([churchId, statusCounts]) => ({
    churchId,
    count: Object.values(statusCounts).reduce((a, b) => a + b, 0),
  }))

  const byStatus = {
    going: rsvps.filter((r) => r.status === "going"),
    maybe: rsvps.filter((r) => r.status === "maybe"),
    declined: rsvps.filter((r) => r.status === "declined"),
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">{event.title}</h2>
            <Badge variant={statusBadgeVariant[event.status] || "secondary"} className="capitalize">
              {event.status}
            </Badge>
            {event.scope === "network" && <Badge variant="outline">Network</Badge>}
          </div>
          <p className="text-muted-foreground mt-1">
            {formatDateTime(event.startsAt)}
            {event.endsAt ? ` – ${formatDateTime(event.endsAt)}` : ""}
            {event.location ? ` · ${event.location}` : ""}
          </p>
        </div>
        <Link href={`/${churchId}/dashboard/events/${id}/edit`}>
          <Button variant="outline">Edit Event</Button>
        </Link>
      </div>
      <Separator />

      {event.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{event.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Going</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.going ?? byStatus.going.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Maybe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.maybe ?? byStatus.maybe.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Declined</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.declined ?? byStatus.declined.length}</div>
          </CardContent>
        </Card>
      </div>

      {event.scope === "network" && byChurch.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>RSVPs by Branch</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {byChurch.map((row) => (
                <li
                  key={row.churchId}
                  className="flex items-center justify-between rounded-md border border-border p-2 text-sm"
                >
                  <span>{row.churchId}</span>
                  <span className="font-semibold">{row.count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>RSVP Roster</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(["going", "maybe", "declined"] as const).map((status) => (
            <div key={status}>
              <h4 className="mb-1 text-sm font-medium capitalize">{status}</h4>
              {byStatus[status].length === 0 ? (
                <p className="text-sm text-muted-foreground">No one yet.</p>
              ) : (
                <ul className="space-y-1">
                  {byStatus[status].map((row) => (
                    <li key={row.id} className="text-sm text-muted-foreground">
                      {rosterName(row)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mark Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceForm
            churchId={churchId}
            eventId={id}
            roster={rsvps.map((row) => ({
              id: row.id,
              memberId: row.memberId,
              memberName: rosterName(row),
              status: row.status,
              attended: Boolean(row.attended),
            }))}
            initialHeadcount={event.headcount ?? null}
          />
        </CardContent>
      </Card>
    </div>
  )
}
