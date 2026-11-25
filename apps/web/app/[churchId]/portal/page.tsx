import { Suspense } from "react"
import Link from "next/link"
import { apiGet } from "@/lib/api-helpers"
import { getTranslator } from "@/lib/i18n/server"

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

interface ServiceSession {
  id: string
  title: string | null
  sessionDate: string
  status: string
  serviceType: { id: string; name: string } | null
}

function formatServiceDate(sessionDate: string): string {
  // Plain YYYY-MM-DD dates: parse as local midnight so the day does not shift.
  const date = new Date(`${sessionDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return sessionDate
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
}

// Open or upcoming sessions for members (GET /attendance/sessions, sorted by date).
async function NextServices({ churchId }: { churchId: string }) {
  const t = await getTranslator()
  try {
    const sessionData = await apiGet<ServiceSession[]>("/attendance/sessions", { churchId })
    const services = Array.isArray(sessionData) ? sessionData.slice(0, 3) : []

    return (
      <section className="border-border bg-card rounded-lg border p-5">
        <h2 className="text-foreground text-base font-semibold">{t("portal.home.servicesTitle")}</h2>
        {services.length === 0 ? (
          <p className="text-muted-foreground mt-2 text-sm">{t("portal.home.servicesEmpty")}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {services.map((service) => (
              <li key={service.id} className="border-border border-t pt-3 first:border-t-0 first:pt-0">
                <p className="text-foreground text-sm font-medium">
                  {service.title || service.serviceType?.name || t("portal.home.servicesFallback")}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {formatServiceDate(service.sessionDate)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    )
  } catch {
    return (
      <section className="border-destructive/50 bg-card rounded-lg border p-5" role="alert">
        <h2 className="text-foreground text-base font-semibold">{t("portal.home.servicesTitle")}</h2>
        <p className="text-destructive mt-2 text-sm">{t("portal.home.servicesError")}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={`/${churchId}/portal`}>{t("common.retry")}</Link>
        </Button>
      </section>
    )
  }
}

async function HomeContent({ churchId }: { churchId: string }) {
  const t = await getTranslator()
  try {
    const announcementData = await apiGet<any[]>("/communications/announcements", { churchId })
    const announcements = Array.isArray(announcementData) ? announcementData : []

    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">{t("portal.home.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("portal.home.subtitle")}
          </p>
        </div>

        <section className="border-border bg-card rounded-lg border p-5">
          <h2 className="text-foreground text-base font-semibold">
            {t("portal.home.announcementsTitle")}
          </h2>
          {announcements.length === 0 ? (
            <p className="text-muted-foreground mt-2 text-sm">
              {t("portal.home.announcementsEmpty")}
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

        <Suspense fallback={<HomeLoading />}>
          <NextServices churchId={churchId} />
        </Suspense>
      </div>
    )
  } catch (error) {
    if (isForbiddenError(error)) {
      return <PortalDeniedState title={t("portal.home.title")} />
    }
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">{t("portal.home.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("portal.home.loadError")}
          </p>
        </div>
        <div className="border-destructive/50 bg-card rounded-lg border p-5">
          <p className="text-destructive text-sm">{t("portal.home.tryAgain")}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href={`/${churchId}/portal`}>{t("common.retry")}</Link>
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
