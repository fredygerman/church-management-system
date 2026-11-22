import { Suspense } from "react"
import Link from "next/link"

import { apiGet } from "@/lib/api-helpers"
import { Button } from "@/components/ui/button"
import { ProfileEditForm } from "@/components/portal/profile-edit-form"

interface PageProps {
  params: Promise<{ churchId: string }>
}
function ProfileLoading() {
  return (
    <div className="border-border bg-card h-64 animate-pulse rounded-lg border" />
  )
}

async function ProfileContent({ churchId }: { churchId: string }) {
  try {
    const member = await apiGet<any | null>("/members/me", { churchId })
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">My Profile</h1>
          <p className="text-muted-foreground text-sm">
            Review and update your church profile.
          </p>
        </div>
        {!member ? (
          <div className="border-border bg-card rounded-lg border p-5">
            <p className="text-muted-foreground text-sm">
              Your account is not linked to a member profile in this church yet.
              Contact your church admin to have your member record connected.
            </p>
          </div>
        ) : (
          <div className="border-border bg-card rounded-lg border p-5">
            <ProfileEditForm churchId={churchId} member={member} />
          </div>
        )}{" "}
        {/* TODO: Add reviewed Swahili copy alongside the English member experience. */}
      </div>
    )
  } catch {
    return (
      <div className="space-y-4">
        <h1 className="text-foreground text-2xl font-semibold">My Profile</h1>
        <div className="border-destructive/50 bg-card rounded-lg border p-5">
          <p className="text-destructive text-sm">
            We could not load your profile.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href={`/${churchId}/portal/profile`}>Retry</Link>
          </Button>
        </div>
      </div>
    )
  }
}

export default async function PortalProfilePage({ params }: PageProps) {
  const { churchId } = await params
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileContent churchId={churchId} />
    </Suspense>
  )
}
