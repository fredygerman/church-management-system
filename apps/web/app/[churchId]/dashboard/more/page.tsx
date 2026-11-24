import Link from "next/link"

import { Button } from "@/components/ui/button"
import { UnavailableState } from "@/components/ui/unavailable-state"

interface PageProps {
  params: Promise<{ churchId: string }>
}

export default async function MorePage({ params }: PageProps) {
  const { churchId } = await params

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">More</h1>
        <p className="text-muted-foreground text-sm">Your account and other staff tools.</p>
      </div>

      <div className="rounded-md border p-5">
        <p className="text-sm">Account</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={`/${churchId}/dashboard/profile`}>My profile</Link>
        </Button>
      </div>

      <UnavailableState
        title="Role settings"
        message="Role settings are not available yet while the permission policy is being decided."
      />
      <UnavailableState
        title="Space switching"
        message="Switching between church spaces is not available yet."
      />

      {/* TODO: Add reviewed Swahili copy for this staff page. */}
    </div>
  )
}
