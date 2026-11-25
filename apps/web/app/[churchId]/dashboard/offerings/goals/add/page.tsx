import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ensurePermission } from "@/lib/permissions-server"
import { getTranslator } from "@/lib/i18n/server"
import { GivingGoalForm } from "@/components/form/GivingGoalForm"

interface PageProps {
  params: Promise<{ churchId: string }>
}

export default async function GivingGoalAddPage({ params }: PageProps) {
  await ensurePermission("manage:giving-goals")
  const t = await getTranslator()
  const { churchId } = await params

  return (
    <div className="flex min-h-screen w-full flex-col p-4">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/${churchId}/dashboard/offerings/goals`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("staff.offerings.back")}
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{t("staff.giving.goals.createTitle")}</h1>
          <p className="text-gray-600">{t("staff.giving.goals.createDescription")}</p>
        </div>
      </div>

      <GivingGoalForm churchId={churchId} />
    </div>
  )
}
