import { FamilyForm } from '@/components/form/FamilyForm'
import { getTranslator } from '@/lib/i18n/server'

export default async function AddFamilyPage({
  params,
}: {
  params: Promise<{
    churchId: string
  }>
}) {
  const { churchId } = await params
  const t = await getTranslator()

  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-8 text-center text-3xl font-bold">
        {t('final.addPage.family')}
      </h1>
      <FamilyForm churchId={churchId} />
    </div>
  )
}
