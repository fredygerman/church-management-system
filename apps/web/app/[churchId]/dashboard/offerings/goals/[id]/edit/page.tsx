import { getGivingGoalById } from "@/actions/giving-goal"
import { ensurePermission } from "@/lib/permissions-server"
import { GivingGoalForm } from "@/components/form/GivingGoalForm"
import { Separator } from "@/components/ui/separator"

interface PageProps {
  params: Promise<{ churchId: string; id: string }>
}

export default async function EditGivingGoalPage({ params }: PageProps) {
  await ensurePermission("manage:giving-goals")
  const { churchId, id } = await params
  const goal = await getGivingGoalById(churchId, id)

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <a href={`/${churchId}/dashboard/offerings/goals`} className="text-blue-600 hover:underline">
              Giving Goals
            </a>
            <span className="text-muted-foreground">/</span>
            <h2 className="text-2xl font-bold tracking-tight">Edit Goal</h2>
          </div>
          <p className="text-muted-foreground mt-1">Edit giving goal details</p>
        </div>
      </div>
      <Separator />

      <GivingGoalForm churchId={churchId} initialData={goal} isEditMode />
    </div>
  )
}
