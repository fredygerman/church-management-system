import { Suspense } from "react"
import Link from "next/link"

import { apiGet } from "@/lib/api-helpers"
import { getTranslator } from "@/lib/i18n/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PortalPrayerRequestForm } from "@/components/portal/prayer-request-form"
import { PortalDeniedState, isForbiddenError } from "@/components/portal/portal-denied-state"

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
  const t = await getTranslator()
  try {
    const response = await apiGet<any[]>("/prayer-requests/me", { churchId })
    const prayerRequests = Array.isArray(response) ? response : []
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">{t("portal.prayer.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("portal.prayer.subtitle")}
          </p>
        </div>
        <div className="border-border bg-card rounded-lg border p-5">
          <h2 className="text-foreground mb-3 text-sm font-medium">
            {t("portal.prayer.submitTitle")}
          </h2>
          <PortalPrayerRequestForm churchId={churchId} />
        </div>
        <div className="border-border bg-card rounded-lg border p-5">
          <h2 className="text-foreground mb-3 text-sm font-medium">
            {t("portal.prayer.yourRequests")}
          </h2>
          {prayerRequests.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t("portal.prayer.empty")}
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
                      {request.status === "answered"
                        ? t("portal.prayer.status.answered")
                        : t("portal.prayer.status.open")}
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
      </div>
    )
  } catch (error) {
    if (isForbiddenError(error)) {
      return <PortalDeniedState title={t("portal.prayer.title")} />
    }
    return (
      <div className="space-y-4">
        <h1 className="text-foreground text-2xl font-semibold">{t("portal.prayer.title")}</h1>
        <div className="border-destructive/50 bg-card rounded-lg border p-5">
          <p className="text-destructive text-sm">
            {t("portal.prayer.loadError")}
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href={`/${churchId}/portal/prayer`}>{t("common.retry")}</Link>
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
