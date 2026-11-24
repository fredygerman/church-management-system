import { Suspense } from "react"
import Link from "next/link"
import { apiGet } from "@/lib/api-helpers"

import { Button } from "@/components/ui/button"
import { PortalDeniedState, isForbiddenError } from "@/components/portal/portal-denied-state"

interface PageProps {
  params: Promise<{ churchId: string }>
}

function HomeLoading() {
  return (
    <div className="border-border bg-card h-24 animate-pulse rounded-lg border" />
  )
}

async function HomeContent({ churchId }: { churchId: string }) {
  try {
    const announcementData = await apiGet<any[]>("/communications/announcements", { churchId })
    const announcements = Array.isArray(announcementData) ? announcementData : []

    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Home</h1>
          <p className="text-muted-foreground text-sm">
            Updates from your selected church branch.
          </p>
        </div>

        <section className="border-border bg-card rounded-lg border p-5">
          <h2 className="text-foreground text-base font-semibold">
            Announcements
          </h2>
          {announcements.length === 0 ? (
            <p className="text-muted-foreground mt-2 text-sm">
              No announcements have been published to members yet.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {announcements.map((announcement: any) => (
                <li
                  key={announcement.id}
                  className="border-border border-t pt-3 first:border-t-0 first:pt-0"
                >
                  <p className="text-foreground text-sm font-medium">
                    {announcement.subject || announcement.name}
                  </p>
                  <p className="text-muted-foreground mt-1 whitespace-pre-wrap text-sm">
                    {announcement.body}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-muted-foreground text-sm">
          Next-service details are not shown because a verified source is not
          available yet.
        </p>
        {/* TODO: Add reviewed Swahili copy alongside the English member experience. */}
      </div>
    )
  } catch (error) {
    if (isForbiddenError(error)) {
      return <PortalDeniedState title="Home" />
    }
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Home</h1>
          <p className="text-muted-foreground text-sm">
            We could not load your church updates.
          </p>
        </div>
        <div className="border-destructive/50 bg-card rounded-lg border p-5">
          <p className="text-destructive text-sm">Please try again.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href={`/${churchId}/portal`}>Retry</Link>
          </Button>
        </div>
      </div>
    )
  }
}

export default async function PortalPage({ params }: PageProps) {
  const { churchId } = await params

  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeContent churchId={churchId} />
    </Suspense>
  )
}
