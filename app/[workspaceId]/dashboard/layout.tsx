import { getWorkspaces } from "@/actions/workspace"

import { SidebarProvider } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import Header from "@/components/layout/header"

interface PageProps {
  params: {
    workspaceId: string
  }
}

export default async function Layout({
  params,
  children,
}: PageProps & { children: React.ReactNode }) {
  const { workspaceId } = params

  const workspaces = await getWorkspaces()
  const currentWorkspace =
    workspaces.find((workspace) => workspace.id.toString() === workspaceId) ||
    null

  console.log("workspaces in layout", workspaces)
  console.log("currentWorkspace in layout", currentWorkspace)
  if (!currentWorkspace) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-xl text-red-500">Error: Workspace not found</p>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <DashboardSidebar
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
      />
      <div className="flex flex-1 flex-col">
        <Header />
        <main>{children}</main>
      </div>
    </SidebarProvider>
  )
}
