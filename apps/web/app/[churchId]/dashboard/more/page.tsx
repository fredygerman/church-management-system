import Link from "next/link"
import { getSession } from "@/auth"
import { Button } from "@/components/ui/button"
import { LanguageSwitch } from "@/components/i18n/language-switch"
import { getTranslator } from "@/lib/i18n/server"
import { hasPermission } from "@/lib/permissions"

interface PageProps {
  params: Promise<{ churchId: string }>
}

export default async function MorePage({ params }: PageProps) {
  const { churchId } = await params
  const t = await getTranslator()
  const session = await getSession()
  const role = session?.user?.activeRole || session?.user?.role
  // Role settings are the existing Permissions page (DEC-06: server authorization unchanged).
  const canManageRoles = hasPermission(role, "manage:users")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("staff.more.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("staff.more.description")}</p>
      </div>

      <div className="rounded-md border p-5 space-y-4">
        <div>
          <p className="text-sm font-medium">{t("staff.more.account")}</p>
          <Button asChild variant="outline" className="mt-2">
            <Link href={`/${churchId}/dashboard/profile`}>{t("staff.more.myProfile")}</Link>
          </Button>
        </div>

        {canManageRoles ? (
          <div>
            <p className="text-sm font-medium">{t("staff.more.roleSettings")}</p>
            <Button asChild variant="outline" className="mt-2">
              <Link href={`/${churchId}/dashboard/permissions`}>{t("staff.more.permissions")}</Link>
            </Button>
          </div>
        ) : null}

        <div>
          <p className="text-sm font-medium">{t("staff.more.spaces")}</p>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("staff.more.spacesHelp")}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium">{t("language.label")}</p>
          <div className="mt-2">
            <LanguageSwitch />
          </div>
        </div>
      </div>
    </div>
  )
}
