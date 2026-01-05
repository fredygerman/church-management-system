import { getChurches } from "@/actions/church"
import { getSession } from "@/auth"
import { redirect } from "next/navigation"

import { CreateChurchDialog } from "@/components/church-management/create-church-dialog"
import { ChurchCard } from "@/components/church-management/church-card"

export default async function HomePage() {
  const session = await getSession()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Get churches for current user
  let churches = []
  try {
    churches = await getChurches()
  } catch (error) {
    console.error('Failed to fetch churches:', error)
  }

  // If HQ user with no churches, redirect to setup
  if (churches.length === 0 && session.user.role === 'SUPER_ADMIN') {
    redirect('/setup')
  }

  // Get member counts for each church
  const churchesWithMembersCount = await Promise.all(
    churches.map(async (church) => {
      const totalMembers = await getChurchMembersCount(church.id)
      return { church, totalMembers }
    })
  )

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-start gap-4 p-8">
      <div className="mb-8 flex w-full items-center justify-between">
        <div className="text-left">
          <h1 className="text-4xl font-bold text-foreground">
            Available Churches
          </h1>
          <p className="mt-2 text-xl text-muted-foreground">
            Select a church to manage
          </p>
        </div>
        <div className="text-right">
          <CreateChurchDialog />
        </div>
      </div>
      {churchesWithMembersCount.length === 0 ? (
        <div className="text-center">
          <p className="text-xl text-muted-foreground">
            You have no church. Create a new church to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {churchesWithMembersCount.map(({ church, totalMembers }) => (
            <ChurchCard
              key={church.id}
              church={church}
              totalMembers={totalMembers}
              className="w-full sm:w-80 lg:w-96"
            />
          ))}
        </div>
      )}
    </div>
  )
}
