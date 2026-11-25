import { Suspense } from "react"
import Link from "next/link"
import { getChurchById } from "@/actions/church"
import { getTranslator } from "@/lib/i18n/server"

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
  const t = await getTranslator()
  try {
    const church = await getChurchById(churchId)

    if (!church) {
      return (
        <div className="space-y-4">
          <h1 className="text-foreground text-2xl font-semibold">{t("portal.church.title")}</h1>
          <div className="border-border bg-card rounded-lg border p-5">
            <p className="text-muted-foreground text-sm">
              {t("portal.church.unavailable")}
            </p>
          </div>
        </div>
      )
    }

    const fields = [
      [t("portal.church.field.name"), church.name],
      [t("portal.church.field.location"), church.location],
      [t("portal.church.field.leadPastor"), church.leadPastorName],
      [t("portal.church.field.phone"), church.phone],
      [t("portal.church.field.email"), church.email],
      [t("portal.church.field.about"), church.description],
    ].filter(([, value]) => value)

    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">{t("portal.church.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("portal.church.subtitle")}
          </p>
        </div>

        {fields.length === 0 ? (
          <div className="border-border bg-card rounded-lg border p-5">
            <p className="text-muted-foreground text-sm">
              {t("portal.church.unavailable")}
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
          {t("portal.church.membershipNote")}
        </p>
      </div>
    )
  } catch (error) {
    if (isForbiddenError(error)) {
      return <PortalDeniedState title={t("portal.church.title")} />
    }
    return (
      <div className="space-y-4">
        <h1 className="text-foreground text-2xl font-semibold">{t("portal.church.title")}</h1>
        <div className="border-destructive/50 bg-card rounded-lg border p-5">
          <p className="text-destructive text-sm">
            {t("portal.church.loadError")}
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href={`/${churchId}/portal/church`}>{t("common.retry")}</Link>
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
