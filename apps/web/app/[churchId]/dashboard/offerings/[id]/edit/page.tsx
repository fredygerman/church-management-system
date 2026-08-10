import { ensurePermission } from "@/lib/permissions-server"
import { getOfferingById, getOfferingCategories } from "@/actions/offering"
import { getGivingGoals } from "@/actions/giving-goal"
import { getMembers } from "@/actions/member"
import { getServiceSessions } from "@/actions/attendance"
import { OfferingForm } from "@/components/form/OfferingForm"
import { Separator } from "@/components/ui/separator"

interface PageProps {
  params: Promise<{ churchId: string; id: string }>
}

export default async function EditOfferingPage({ params }: PageProps) {
  await ensurePermission("manage:offerings")
  const { churchId, id } = await params

  const [offering, categories, membersResult, sessions, allGoals] = await Promise.all([
    getOfferingById(churchId, id),
    getOfferingCategories(churchId),
    getMembers(
      {
        page: 1,
        per_page: 200,
        sort: "firstName.asc",
        firstName: "",
        lastName: "",
        gender: "",
        maritalStatus: "",
        occupation: "",
        from: "",
        to: "",
      },
      churchId
    ),
    getServiceSessions(churchId).catch(() => []),
    getGivingGoals(churchId).catch(() => []),
  ])

  // Active goals for the picker, plus this offering's already-linked goal
  // (even if it has since ended) so the current selection still renders.
  const goals = allGoals.filter(
    (goal: any) => goal.status === "active" || goal.id === offering?.goalId
  )

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <a href={`/${churchId}/dashboard/offerings`} className="text-blue-600 hover:underline">
              Offerings
            </a>
            <span className="text-muted-foreground">/</span>
            <h2 className="text-2xl font-bold tracking-tight">Edit Offering</h2>
          </div>
          <p className="text-muted-foreground mt-1">Edit offering details</p>
        </div>
      </div>
      <Separator />

      <OfferingForm
        churchId={churchId}
        categories={categories}
        members={membersResult.members}
        sessions={Array.isArray(sessions) ? sessions : []}
        goals={goals}
        initialData={offering}
        isEditMode
      />
    </div>
  )
}
