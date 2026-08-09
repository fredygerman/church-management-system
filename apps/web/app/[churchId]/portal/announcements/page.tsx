export default function PortalAnnouncementsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Announcements</h1>
        <p className="text-sm text-muted-foreground">
          Read updates shared with your church.
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">
          Announcements will appear here when campaigns are published to members.
        </p>
      </div>
    </div>
  )
}
