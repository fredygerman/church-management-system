import { ensurePermission } from "@/lib/permissions-server"
import { getTranslator } from "@/lib/i18n/server"
import { getOfferingById, getOfferingCategories } from "@/actions/offering"
import { getGivingGoals } from "@/actions/giving-goal"
import { getMembers } from "@/actions/member"
import { getServiceSessions } from "@/actions/attendance"
import { OfferingForm } from "@/components/form/OfferingForm"
import { Separator } from "@/components/ui/separator"
import { UnavailableState } from "@/components/ui/unavailable-state"

interface PageProps {
  params: Promise<{ churchId: string; id: string }>
}

export default async function EditOfferingPage({ params }: PageProps) {
  await ensurePermission("manage:offerings")
  const t = await getTranslator()
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

  if (membersResult.status === "unavailable") {
    return (
      <UnavailableState
        title={t("component.members.unavailableTitle")}
        message={membersResult.message}
      />
    )
  }

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
              {t("nav.offerings")}
            </a>
            <span className="text-muted-foreground">/</span>
            <h2 className="text-2xl font-bold tracking-tight">{t("staff.offerings.editTitle")}</h2>
          </div>
          <p className="text-muted-foreground mt-1">{t("staff.offerings.editDescription")}</p>
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
