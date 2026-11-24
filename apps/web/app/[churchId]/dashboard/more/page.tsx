import Link from "next/link"
import { getSession } from "@/auth"
import { Button } from "@/components/ui/button"
import { hasPermission } from "@/lib/permissions"

interface PageProps {
  params: Promise<{ churchId: string }>
}

export default async function MorePage({ params }: PageProps) {
  const { churchId } = await params
  const session = await getSession()
  const role = session?.user?.activeRole || session?.user?.role
  // Role settings are the existing Permissions page (DEC-06: server authorization unchanged).
  const canManageRoles = hasPermission(role, "manage:users")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">More</h1>
        <p className="text-muted-foreground text-sm">Your account and other staff tools.</p>
      </div>

      <div className="rounded-md border p-5 space-y-4">
        <div>
          <p className="text-sm font-medium">Account</p>
          <Button asChild variant="outline" className="mt-2">
            <Link href={`/${churchId}/dashboard/profile`}>My profile</Link>
          </Button>
        </div>

        {canManageRoles ? (
          <div>
            <p className="text-sm font-medium">Role settings</p>
            <Button asChild variant="outline" className="mt-2">
              <Link href={`/${churchId}/dashboard/permissions`}>Permissions</Link>
            </Button>
          </div>
        ) : null}

        <div>
          <p className="text-sm font-medium">Church spaces</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Switch church from the church menu in the sidebar. You will be asked to confirm.
          </p>
        </div>
      </div>

      {/* TODO: Add reviewed Swahili copy for this staff page. */}
    </div>
  )
}
