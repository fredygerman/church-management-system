export default function PortalFamilyPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Family</h1>
        <p className="text-sm text-muted-foreground">
          See household connections for this church.
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">
          Family details appear here after your member profile is linked.
        </p>
      </div>
    </div>
  )
}
