import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ensurePermission } from "@/lib/permissions-server"
import { GivingGoalForm } from "@/components/form/GivingGoalForm"

interface PageProps {
  params: Promise<{ churchId: string }>
}

export default async function GivingGoalAddPage({ params }: PageProps) {
  await ensurePermission("manage:giving-goals")
  const { churchId } = await params

  return (
    <div className="flex min-h-screen w-full flex-col p-4">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/${churchId}/dashboard/offerings/goals`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create Giving Goal</h1>
          <p className="text-gray-600">Start a new fundraising goal for your church</p>
        </div>
      </div>

      <GivingGoalForm churchId={churchId} />
    </div>
  )
}
