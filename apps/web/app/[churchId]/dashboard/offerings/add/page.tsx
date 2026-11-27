import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ensurePermission } from "@/lib/permissions-server"
import { getTranslator } from "@/lib/i18n/server"
import { getOfferingCategories } from "@/actions/offering"
import { getGivingGoals } from "@/actions/giving-goal"
import { getMembers } from "@/actions/member"
import { getServiceSessions } from "@/actions/attendance"
import { OfferingForm } from "@/components/form/OfferingForm"
import { UnavailableNotice } from "@/components/ui/unavailable-state"
import { loadOrUnavailable } from "@/lib/load-or-unavailable"

interface PageProps {
  params: Promise<{ churchId: string }>
}

export default async function OfferingAddPage({ params }: PageProps) {
  await ensurePermission("manage:offerings")
  const t = await getTranslator()
  const { churchId } = await params

  const [categoriesResult, membersResult, sessionsResult, goalsResult] = await Promise.all([
    loadOrUnavailable(() => getOfferingCategories(churchId, { throwOnError: true })),
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
    loadOrUnavailable(() => getServiceSessions(churchId)),
    loadOrUnavailable(() => getGivingGoals(churchId, { throwOnError: true })),
  ])

  // A failed list is shown as an error, never as an empty picker. Submit stays
  // disabled, because saving would silently omit the link the user cannot see.
  const pickersFailed = [categoriesResult, membersResult, sessionsResult, goalsResult].some(
    (result) => result.status === "unavailable"
  )
  const categories = categoriesResult.status === "ok" ? categoriesResult.data : []
  const members = membersResult.status === "ok" ? membersResult.members : []
  const sessions =
    sessionsResult.status === "ok" && Array.isArray(sessionsResult.data) ? sessionsResult.data : []
  const goals =
    goalsResult.status === "ok"
      ? goalsResult.data.filter((goal: any) => goal.status === "active")
      : []

  return (
    <div className="flex min-h-screen w-full flex-col p-4">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/${churchId}/dashboard/offerings`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("staff.offerings.back")}
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{t("staff.offerings.record")}</h1>
          <p className="text-gray-600">{t("staff.offerings.recordDescription")}</p>
        </div>
      </div>

      {pickersFailed && (
        <div className="mb-6">
          <UnavailableNotice
            title={t("staff.common.unavailableTitle")}
            message={t("staff.common.unavailableMessage")}
          />
        </div>
      )}

      <OfferingForm
        churchId={churchId}
        categories={categories}
        members={members}
        sessions={sessions}
        goals={goals}
        submitDisabled={pickersFailed}
      />
    </div>
  )
}
