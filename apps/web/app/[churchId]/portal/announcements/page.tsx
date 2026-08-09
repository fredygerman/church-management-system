import { getMyAnnouncements } from "@/actions/portal"

interface PageProps {
  params: Promise<{ churchId: string }>
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Unknown date"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Unknown date"
  return date.toLocaleDateString()
}

export default async function PortalAnnouncementsPage({ params }: PageProps) {
  const { churchId } = await params
  const announcements = await getMyAnnouncements(churchId)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Announcements</h1>
        <p className="text-sm text-muted-foreground">
          Read updates shared with your church.
        </p>
      </div>

      {announcements.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            No announcements have been published to members yet.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {announcements.map((announcement: any) => (
            <li key={announcement.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {announcement.subject || announcement.name}
                </p>
                <p className="text-xs text-muted-foreground">{formatDate(announcement.sentAt)}</p>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                {announcement.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
