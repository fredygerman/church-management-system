import { Suspense } from "react"
import Link from "next/link"

import { apiGet } from "@/lib/api-helpers"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PortalPrayerRequestForm } from "@/components/portal/prayer-request-form"

interface PageProps {
  params: Promise<{ churchId: string }>
}
function PrayerLoading() {
  return (
    <div className="border-border bg-card h-72 animate-pulse rounded-lg border" />
  )
}
function formatDate(value: string | null | undefined): string {
  if (!value) return ""
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString()
}

async function PrayerContent({ churchId }: { churchId: string }) {
  try {
    const response = await apiGet<any[]>("/prayer-requests/me", { churchId })
    const prayerRequests = Array.isArray(response) ? response : []
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Prayer</h1>
          <p className="text-muted-foreground text-sm">
            Submit and follow up on prayer requests.
          </p>
        </div>
        <div className="border-border bg-card rounded-lg border p-5">
          <h2 className="text-foreground mb-3 text-sm font-medium">
            Submit a prayer request
          </h2>
          <PortalPrayerRequestForm churchId={churchId} />
        </div>
        <div className="border-border bg-card rounded-lg border p-5">
          <h2 className="text-foreground mb-3 text-sm font-medium">
            Your requests
          </h2>
          {prayerRequests.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              You have not submitted any prayer requests yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {prayerRequests.map((request: any) => (
                <li
                  key={request.id}
                  className="border-border rounded-md border p-3"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <Badge
                      variant={
                        request.status === "answered" ? "default" : "secondary"
                      }
                    >
                      {request.status === "answered" ? "Answered" : "Open"}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {formatDate(request.createdAt)}
                    </span>
                  </div>
                  <p className="text-foreground text-sm">{request.content}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* TODO: Add reviewed Swahili copy alongside the English member experience. */}
      </div>
    )
  } catch {
    return (
      <div className="space-y-4">
        <h1 className="text-foreground text-2xl font-semibold">Prayer</h1>
        <div className="border-destructive/50 bg-card rounded-lg border p-5">
          <p className="text-destructive text-sm">
            We could not load your prayer requests.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href={`/${churchId}/portal/prayer`}>Retry</Link>
          </Button>
        </div>
      </div>
    )
  }
}

export default async function PortalPrayerPage({ params }: PageProps) {
  const { churchId } = await params
  return (
    <Suspense fallback={<PrayerLoading />}>
      <PrayerContent churchId={churchId} />
    </Suspense>
  )
}
