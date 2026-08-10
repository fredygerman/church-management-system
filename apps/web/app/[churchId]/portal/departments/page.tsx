import { getDepartments } from "@/actions/department"

interface PageProps {
  params: Promise<{ churchId: string }>
}

export default async function PortalDepartmentsPage({ params }: PageProps) {
  const { churchId } = await params
  const departments = await getDepartments(churchId)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Departments</h1>
        <p className="text-sm text-muted-foreground">
          View the departments you lead.
        </p>
      </div>

      {departments.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            You don&apos;t lead any departments yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {departments.map((department) => (
            <div key={department.id} className="rounded-lg border border-border bg-card p-5">
              <div className="mb-2">
                <h2 className="text-base font-semibold text-foreground">{department.name}</h2>
              </div>
              {department.description && (
                <p className="text-sm text-muted-foreground mb-2">{department.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {department.meetingDay && (
                  <span>Meeting: {department.meetingDay}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
