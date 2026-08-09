import { getMyFamily } from "@/actions/portal"

interface PageProps {
  params: Promise<{ churchId: string }>
}

export default async function PortalFamilyPage({ params }: PageProps) {
  const { churchId } = await params
  const data = await getMyFamily(churchId)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Family</h1>
        <p className="text-sm text-muted-foreground">
          See household connections for this church.
        </p>
      </div>

      {!data ? (
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Family details appear here after your member profile is linked to a family.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-xs font-medium uppercase text-muted-foreground">Family Name</p>
            <p className="text-sm text-foreground">{data.family.familyName}</p>
          </div>

          {data.spouse && (
            <div className="rounded-lg border border-border bg-card p-5">
              <p className="text-xs font-medium uppercase text-muted-foreground">Spouse</p>
              <p className="text-sm text-foreground">
                {data.spouse.firstName} {data.spouse.lastName}
              </p>
            </div>
          )}

          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Other Family Members
            </p>
            {data.members.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                No other members are linked to this family yet.
              </p>
            ) : (
              <ul className="mt-2 space-y-1">
                {data.members
                  .filter((member: any) => member.id !== data.spouse?.id)
                  .map((member: any) => (
                    <li key={member.id} className="text-sm text-foreground">
                      {member.firstName} {member.lastName}
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
