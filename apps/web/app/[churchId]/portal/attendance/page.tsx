import { getMyAttendance } from "@/actions/portal"

interface PageProps {
  params: Promise<{ churchId: string }>
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Unknown date"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Unknown date"
  return date.toLocaleDateString()
}

export default async function PortalAttendancePage({ params }: PageProps) {
  const { churchId } = await params
  const checkins = await getMyAttendance(churchId)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Attendance</h1>
        <p className="text-sm text-muted-foreground">
          Track your recent check-ins and service participation.
        </p>
      </div>

      {checkins.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            You don&apos;t have any recorded check-ins for this church yet.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {checkins.map((checkin: any) => (
            <li
              key={checkin.checkinId}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {checkin.sessionTitle || checkin.serviceTypeName}
                </p>
                <p className="text-xs text-muted-foreground">{checkin.serviceTypeName}</p>
              </div>
              <p className="text-sm text-muted-foreground">{formatDate(checkin.sessionDate)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
