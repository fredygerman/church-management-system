import { getOfferingCategoryById } from "@/actions/offering"
import { ensurePermission } from "@/lib/permissions-server"
import { OfferingCategoryForm } from "@/components/form/OfferingCategoryForm"
import { Separator } from "@/components/ui/separator"

interface PageProps {
  params: Promise<{ churchId: string; id: string }>
}

export default async function EditOfferingCategoryPage({ params }: PageProps) {
  await ensurePermission("manage:offerings")
  const { churchId, id } = await params
  const category = await getOfferingCategoryById(churchId, id)

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <a href={`/${churchId}/dashboard/offerings/categories`} className="text-blue-600 hover:underline">
              Offering Categories
            </a>
            <span className="text-muted-foreground">/</span>
            <h2 className="text-2xl font-bold tracking-tight">Edit Category</h2>
          </div>
          <p className="text-muted-foreground mt-1">Edit offering category details</p>
        </div>
      </div>
      <Separator />

      <OfferingCategoryForm churchId={churchId} initialData={category} isEditMode />
    </div>
  )
}
