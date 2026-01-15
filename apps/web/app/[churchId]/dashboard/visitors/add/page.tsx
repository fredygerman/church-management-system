import { VisitorForm } from "@/components/form/VisitorForm"

export default async function AddVisitorPage({
  params,
}: {
  params: Promise<{ churchId: string }>
}) {
  const { churchId } = await params

  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-8 text-center text-3xl font-bold">
        Add New Visitor
      </h1>
      <VisitorForm churchId={churchId} />
    </div>
  )
}
