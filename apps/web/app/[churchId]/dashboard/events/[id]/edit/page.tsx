import { ensurePermission } from "@/lib/permissions-server"
import { getEventById } from "@/actions/event"
import { EventForm } from "@/components/event/event-form"
import { Separator } from "@/components/ui/separator"

interface PageProps {
  params: Promise<{ churchId: string; id: string }>
}

export default async function EditEventPage({ params }: PageProps) {
  await ensurePermission("manage:events")
  const { churchId, id } = await params

  const event = await getEventById(churchId, id)

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <a href={`/${churchId}/dashboard/events`} className="text-blue-600 hover:underline">
              Events
            </a>
            <span className="text-muted-foreground">/</span>
            <h2 className="text-2xl font-bold tracking-tight">Edit Event</h2>
          </div>
          <p className="text-muted-foreground mt-1">Edit event details</p>
        </div>
      </div>
      <Separator />

      <EventForm churchId={churchId} initialData={event} isEditMode />
    </div>
  )
}
