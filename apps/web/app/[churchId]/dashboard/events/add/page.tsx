import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ensurePermission } from "@/lib/permissions-server"
import { EventForm } from "@/components/event/event-form"

interface PageProps {
  params: Promise<{ churchId: string }>
}

export default async function EventAddPage({ params }: PageProps) {
  await ensurePermission("manage:events")
  const { churchId } = await params

  return (
    <div className="flex min-h-screen w-full flex-col p-4">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/${churchId}/dashboard/events`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create Event</h1>
          <p className="text-gray-600">Add a camp meeting, seminar, or social to the calendar</p>
        </div>
      </div>

      <EventForm churchId={churchId} />
    </div>
  )
}
