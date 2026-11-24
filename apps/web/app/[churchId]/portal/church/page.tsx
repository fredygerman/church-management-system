import { Suspense } from "react"
import Link from "next/link"
import { getChurchById } from "@/actions/church"

import { Button } from "@/components/ui/button"
import { PortalDeniedState, isForbiddenError } from "@/components/portal/portal-denied-state"

interface PageProps {
  params: Promise<{ churchId: string }>
}

function ChurchLoading() {
  return (
    <div className="border-border bg-card h-48 animate-pulse rounded-lg border" />
  )
}

async function ChurchContent({ churchId }: { churchId: string }) {
  try {
    const church = await getChurchById(churchId)

    if (!church) {
      return (
        <div className="space-y-4">
          <h1 className="text-foreground text-2xl font-semibold">Church</h1>
          <div className="border-border bg-card rounded-lg border p-5">
            <p className="text-muted-foreground text-sm">
              Public information for this church branch is not available.
            </p>
          </div>
        </div>
      )
    }

    const fields = [
      ["Name", church.name],
      ["Location", church.location],
      ["Lead pastor", church.leadPastorName],
      ["Phone", church.phone],
      ["Email", church.email],
      ["About", church.description],
    ].filter(([, value]) => value)

    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Church</h1>
          <p className="text-muted-foreground text-sm">
            Public information for your selected church branch.
          </p>
        </div>

        {fields.length === 0 ? (
          <div className="border-border bg-card rounded-lg border p-5">
            <p className="text-muted-foreground text-sm">
              Public information for this church branch is not available.
            </p>
          </div>
        ) : (
          <div className="border-border bg-card rounded-lg border p-5">
            <dl className="grid gap-4 sm:grid-cols-2">
              {fields.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-muted-foreground text-xs font-medium uppercase">
                    {label}
                  </dt>
                  <dd className="text-foreground whitespace-pre-wrap text-sm">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <p className="text-muted-foreground text-sm">
          Viewing a church does not change your active membership.
        </p>
        {/* TODO: Add reviewed Swahili copy alongside the English member experience. */}
      </div>
    )
  } catch (error) {
    if (isForbiddenError(error)) {
      return <PortalDeniedState title="Church" />
    }
    return (
      <div className="space-y-4">
        <h1 className="text-foreground text-2xl font-semibold">Church</h1>
        <div className="border-destructive/50 bg-card rounded-lg border p-5">
          <p className="text-destructive text-sm">
            We could not load this church branch.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href={`/${churchId}/portal/church`}>Retry</Link>
          </Button>
        </div>
      </div>
    )
  }
}

export default async function PortalChurchPage({ params }: PageProps) {
  const { churchId } = await params

  return (
    <Suspense fallback={<ChurchLoading />}>
      <ChurchContent churchId={churchId} />
    </Suspense>
  )
}
