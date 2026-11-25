import { getMyFamily } from "@/actions/portal"
import { getTranslator } from "@/lib/i18n/server"

interface PageProps {
  params: Promise<{ churchId: string }>
}

export default async function PortalFamilyPage({ params }: PageProps) {
  const { churchId } = await params
  const t = await getTranslator()
  const data = await getMyFamily(churchId)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t("portal.nav.family")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("final.portal.family.subtitle")}
        </p>
      </div>

      {!data ? (
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            {t("final.portal.family.empty")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-xs font-medium uppercase text-muted-foreground">{t("final.portal.family.name")}</p>
            <p className="text-sm text-foreground">{data.family.familyName}</p>
          </div>

          {data.spouse && (
            <div className="rounded-lg border border-border bg-card p-5">
              <p className="text-xs font-medium uppercase text-muted-foreground">{t("final.portal.family.spouse")}</p>
              <p className="text-sm text-foreground">
                {data.spouse.firstName} {data.spouse.lastName}
              </p>
            </div>
          )}

          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              {t("final.portal.family.others")}
            </p>
            {data.members.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {t("final.portal.family.noOthers")}
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
