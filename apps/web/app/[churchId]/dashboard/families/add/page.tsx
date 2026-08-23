import { FamilyForm } from '@/components/form/FamilyForm'

export default async function AddFamilyPage({
  params,
}: {
  params: Promise<{
    churchId: string
  }>
}) {
  const { churchId } = await params

  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-8 text-center text-3xl font-bold">
        Add New Family
      </h1>
      <FamilyForm churchId={churchId} />
    </div>
  )
}
