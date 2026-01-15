import { redirect } from "next/navigation"
import { checkIsAdmin } from "@/lib/permissions-server"
import { PermissionsViewer } from "@/components/permissions/permissions-viewer"

export default async function PermissionsPage({
  params,
}: {
  params: Promise<{ churchId: string }>
}) {
  const { churchId } = await params
  
  // Only admins can view this page
  const isAdmin = await checkIsAdmin()
  if (!isAdmin) {
    redirect(`/${churchId}/dashboard`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Permissions Overview</h1>
        <p className="text-muted-foreground">
          View all available permissions for each role in the system
        </p>
      </div>

      <PermissionsViewer />
    </div>
  )
}
