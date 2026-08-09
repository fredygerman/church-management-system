import { getMyProfile } from "@/actions/portal"

interface PageProps {
  params: Promise<{ churchId: string }>
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Not set"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Not set"
  return date.toLocaleDateString()
}

function titleCase(value: string | null | undefined): string {
  if (!value) return "Not set"
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export default async function PortalProfilePage({ params }: PageProps) {
  const { churchId } = await params
  const member = await getMyProfile(churchId)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">My Profile</h1>
        <p className="text-sm text-muted-foreground">
          Review your church profile and contact details.
        </p>
      </div>

      {!member ? (
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Your account isn&apos;t linked to a member profile in this church yet. Contact
            your church admin to have your member record connected.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-5">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase text-muted-foreground">Name</dt>
              <dd className="text-sm text-foreground">{member.firstName} {member.lastName}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-muted-foreground">Phone</dt>
              <dd className="text-sm text-foreground">{member.phone || "Not set"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-muted-foreground">Date of Birth</dt>
              <dd className="text-sm text-foreground">{formatDate(member.dateOfBirth)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-muted-foreground">Gender</dt>
              <dd className="text-sm text-foreground">{titleCase(member.gender)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-muted-foreground">Occupation</dt>
              <dd className="text-sm text-foreground">{member.occupation || "Not set"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-muted-foreground">Marital Status</dt>
              <dd className="text-sm text-foreground">{titleCase(member.maritalStatus)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-muted-foreground">Date of Salvation</dt>
              <dd className="text-sm text-foreground">{formatDate(member.dateOfSalvation)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-muted-foreground">Baptism Status</dt>
              <dd className="text-sm text-foreground">{titleCase(member.baptismStatus)}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  )
}
