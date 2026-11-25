import { redirect } from "next/navigation"
import { checkIsAdmin } from "@/lib/permissions-server"
import { PermissionsViewer } from "@/components/permissions/permissions-viewer"
import { getTranslator } from "@/lib/i18n/server"

export default async function PermissionsPage({
  params,
}: {
  params: Promise<{ churchId: string }>
}) {
  const t = await getTranslator()
  const { churchId } = await params
  
  // Only admins can view this page
  const isAdmin = await checkIsAdmin()
  if (!isAdmin) {
    redirect(`/${churchId}/dashboard`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('staff.permissions.title')}</h1>
        <p className="text-muted-foreground">
          {t('staff.permissions.description')}
        </p>
      </div>

      <PermissionsViewer />
    </div>
  )
}
