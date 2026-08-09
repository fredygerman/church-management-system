import { getMyPrayerRequests } from "@/actions/prayer"
import { PrayerRequestForm } from "@/components/form/PrayerRequestForm"
import { Badge } from "@/components/ui/badge"

interface PageProps {
  params: Promise<{ churchId: string }>
}

function formatDate(value: string | null | undefined): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleDateString()
}

export default async function PortalPrayerPage({ params }: PageProps) {
  const { churchId } = await params
  const prayerRequests = await getMyPrayerRequests(churchId)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Prayer</h1>
        <p className="text-sm text-muted-foreground">
          Submit and follow up on prayer requests.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-medium text-foreground">Submit a Prayer Request</h2>
        <PrayerRequestForm churchId={churchId} />
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-medium text-foreground">Your Requests</h2>
        {prayerRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You haven&apos;t submitted any prayer requests yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {prayerRequests.map((request) => (
              <li key={request.id} className="rounded-md border border-border p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <Badge variant={request.status === "answered" ? "default" : "secondary"}>
                    {request.status === "answered" ? "Answered" : "Open"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(request.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-foreground">{request.content}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
