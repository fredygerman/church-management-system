import { getWorkspaceMembersCount, getWorkspaces } from "@/actions/workspace"

import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog"
import { WorkspaceCard } from "@/components/workspace/workspace-card"

export default async function HomePage() {
  const workspaces = await getWorkspaces()

  if (!workspaces) {
    return <div>Loading...</div>
  }

  const workspacesWithMembersCount = await Promise.all(
    workspaces.map(async (workspace) => {
      const totalMembers = await getWorkspaceMembersCount(workspace.id)
      return { workspace, totalMembers }
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
          <CreateWorkspaceDialog />
        </div>
      </div>
      {workspacesWithMembersCount.length === 0 ? (
        <div className="text-center">
          <p className="text-xl text-muted-foreground">
            You have no church. Create a new church to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {workspacesWithMembersCount.map(({ workspace, totalMembers }) => (
            <WorkspaceCard
              key={workspace.id}
              workspace={workspace}
              totalMembers={totalMembers}
              className="w-full sm:w-80 lg:w-96"
            />
          ))}
        </div>
      )}
    </div>
  )
}
