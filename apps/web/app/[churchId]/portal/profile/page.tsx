import { Suspense } from "react"
import Link from "next/link"

import { apiGet } from "@/lib/api-helpers"
import { getTranslator } from "@/lib/i18n/server"
import { Button } from "@/components/ui/button"
import { LanguageSwitch } from "@/components/i18n/language-switch"
import { ProfileEditForm } from "@/components/portal/profile-edit-form"
import { PortalDeniedState, isForbiddenError } from "@/components/portal/portal-denied-state"

interface PageProps {
  params: Promise<{ churchId: string }>
}
function ProfileLoading() {
  return (
    <div className="border-border bg-card h-64 animate-pulse rounded-lg border" />
  )
}

async function ProfileContent({ churchId }: { churchId: string }) {
  const t = await getTranslator()
  try {
    const member = await apiGet<any | null>("/members/me", { churchId })
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">{t("portal.profile.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("portal.profile.subtitle")}
          </p>
        </div>
        <section className="border-border bg-card rounded-lg border p-5">
          <h2 className="text-foreground text-base font-semibold">{t("portal.profile.languageTitle")}</h2>
          <div className="mt-3">
            <LanguageSwitch />
          </div>
        </section>
        {!member ? (
          <div className="border-border bg-card rounded-lg border p-5">
            <p className="text-muted-foreground text-sm">
              {t("portal.profile.notLinked")}
            </p>
          </div>
        ) : (
          <div className="border-border bg-card rounded-lg border p-5">
            <ProfileEditForm churchId={churchId} member={member} />
          </div>
        )}{" "}
      </div>
    )
  } catch (error) {
    if (isForbiddenError(error)) {
      return <PortalDeniedState title={t("portal.profile.title")} />
    }
    return (
      <div className="space-y-4">
        <h1 className="text-foreground text-2xl font-semibold">{t("portal.profile.title")}</h1>
        <div className="border-destructive/50 bg-card rounded-lg border p-5">
          <p className="text-destructive text-sm">
            {t("portal.profile.loadError")}
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href={`/${churchId}/portal/profile`}>{t("common.retry")}</Link>
          </Button>
        </div>
      </div>
    )
  }
}

export default async function PortalProfilePage({ params }: PageProps) {
  const { churchId } = await params
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileContent churchId={churchId} />
    </Suspense>
  )
}
