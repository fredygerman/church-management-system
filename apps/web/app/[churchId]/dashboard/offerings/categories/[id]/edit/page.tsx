import { getOfferingCategoryById } from "@/actions/offering"
import { ensurePermission } from "@/lib/permissions-server"
import { getTranslator } from "@/lib/i18n/server"
import { OfferingCategoryForm } from "@/components/form/OfferingCategoryForm"
import { Separator } from "@/components/ui/separator"

interface PageProps {
  params: Promise<{ churchId: string; id: string }>
}

export default async function EditOfferingCategoryPage({ params }: PageProps) {
  await ensurePermission("manage:offerings")
  const t = await getTranslator()
  const { churchId, id } = await params
  const category = await getOfferingCategoryById(churchId, id)

  if (!category) {
    return (
      <div className="flex flex-col space-y-4">
        <a href={`/${churchId}/dashboard/offerings/categories`} className="text-blue-600 hover:underline">
          {t("staff.giving.categories.backLink")}
        </a>
        <p className="text-muted-foreground">{t("staff.giving.categories.notFound")}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <a href={`/${churchId}/dashboard/offerings/categories`} className="text-blue-600 hover:underline">
              {t("staff.giving.categories.title")}
            </a>
            <span className="text-muted-foreground">/</span>
            <h2 className="text-2xl font-bold tracking-tight">{t("staff.giving.categories.edit")}</h2>
          </div>
          <p className="text-muted-foreground mt-1">{t("staff.giving.categories.editDescription")}</p>
        </div>
      </div>
      <Separator />

      <OfferingCategoryForm churchId={churchId} initialData={category} isEditMode />
    </div>
  )
}
