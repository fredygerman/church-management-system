import { getGivingGoalById } from "@/actions/giving-goal"
import { ensurePermission } from "@/lib/permissions-server"
import { getTranslator } from "@/lib/i18n/server"
import { GivingGoalForm } from "@/components/form/GivingGoalForm"
import { Separator } from "@/components/ui/separator"

interface PageProps {
  params: Promise<{ churchId: string; id: string }>
}

export default async function EditGivingGoalPage({ params }: PageProps) {
  await ensurePermission("manage:giving-goals")
  const t = await getTranslator()
  const { churchId, id } = await params
  const goal = await getGivingGoalById(churchId, id)

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <a href={`/${churchId}/dashboard/offerings/goals`} className="text-blue-600 hover:underline">
              {t("staff.giving.goals.title")}
            </a>
            <span className="text-muted-foreground">/</span>
            <h2 className="text-2xl font-bold tracking-tight">{t("staff.giving.goals.edit")}</h2>
          </div>
          <p className="text-muted-foreground mt-1">{t("staff.giving.goals.editDescription")}</p>
        </div>
      </div>
      <Separator />

      <GivingGoalForm churchId={churchId} initialData={goal} isEditMode />
    </div>
  )
}
