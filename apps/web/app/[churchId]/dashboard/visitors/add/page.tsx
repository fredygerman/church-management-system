import { VisitorForm } from "@/components/form/VisitorForm"
import { ensurePermission } from "@/lib/permissions-server"
import { getTranslator } from "@/lib/i18n/server"

export default async function AddVisitorPage({
  params,
}: {
  params: Promise<{ churchId: string }>
}) {
  await ensurePermission('create:visitor')
  const { churchId } = await params
  const t = await getTranslator()

  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-8 text-center text-3xl font-bold">
        {t('final.addPage.visitor')}
      </h1>
      <VisitorForm churchId={churchId} />
    </div>
  )
}
