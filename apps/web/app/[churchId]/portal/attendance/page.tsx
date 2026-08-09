export default function PortalAttendancePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Attendance</h1>
        <p className="text-sm text-muted-foreground">
          Track your recent check-ins and service participation.
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">
          Attendance history will show once check-ins are connected to your member record.
        </p>
      </div>
    </div>
  )
}
