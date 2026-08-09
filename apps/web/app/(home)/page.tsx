import { getChurches } from "@/actions/church"
import { getSession } from "@/auth"
import { redirect } from "next/navigation"

import { CreateChurchDialog } from "@/components/church-management/create-church-dialog"
import { ChurchCard } from "@/components/church-management/church-card"
import { hasPermission } from "@/lib/permissions"

export default async function HomePage() {
  const session = await getSession()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Get churches for current user
  const churchesResult = await getChurches()
  
  // If no churches returned, redirect to setup
  if (!churchesResult || churchesResult.length === 0) {
    redirect('/setup')
  }

  const churches = churchesResult
  const canManageChurches = hasPermission(session.user.role, "manage:churches")

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-start gap-4 p-8">
      <div className="mb-8 flex w-full items-center justify-between">
        <div className="text-left">
          <h1 className="text-4xl font-bold text-foreground">
            My Churches
          </h1>
          <p className="mt-2 text-xl text-muted-foreground">
            Select a church to continue
          </p>
        </div>
        {canManageChurches ? <div className="text-right">
          <CreateChurchDialog />
        </div> : null}
      </div>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {churches.map((church: any) => (
          <ChurchCard
            key={church.id}
            church={church}
            totalMembers={0}
            className="w-full sm:w-80 lg:w-96"
          />
        ))}
      </div>
    </div>
  )
}
