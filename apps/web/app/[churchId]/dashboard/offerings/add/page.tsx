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
import { UnavailableState } from "@/components/ui/unavailable-state"

interface PageProps {
  params: Promise<{ churchId: string }>
}

export default async function OfferingAddPage({ params }: PageProps) {
  await ensurePermission("manage:offerings")
  const t = await getTranslator()
  const { churchId } = await params

  const [categories, membersResult, sessions, goals] = await Promise.all([
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

      <OfferingForm
        churchId={churchId}
        categories={categories}
        members={membersResult.members}
        sessions={Array.isArray(sessions) ? sessions : []}
        goals={goals.filter((goal: any) => goal.status === "active")}
      />
    </div>
  )
}
