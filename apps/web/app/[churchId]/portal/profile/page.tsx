export default function PortalProfilePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">My Profile</h1>
        <p className="text-sm text-muted-foreground">
          Review your church profile and contact details.
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">
          Profile editing will use the member record linked to this church membership.
        </p>
      </div>
    </div>
  )
}
