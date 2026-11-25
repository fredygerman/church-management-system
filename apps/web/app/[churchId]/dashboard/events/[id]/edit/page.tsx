import { ensurePermission } from "@/lib/permissions-server"
import { getTranslator } from "@/lib/i18n/server"
import { getEventById } from "@/actions/event"
import { EventForm } from "@/components/event/event-form"
import { Separator } from "@/components/ui/separator"

interface PageProps {
  params: Promise<{ churchId: string; id: string }>
}

export default async function EditEventPage({ params }: PageProps) {
  await ensurePermission("manage:events")
  const t = await getTranslator()
  const { churchId, id } = await params

  const event = await getEventById(churchId, id)

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <a href={`/${churchId}/dashboard/events`} className="text-blue-600 hover:underline">
              {t("nav.events")}
            </a>
            <span className="text-muted-foreground">/</span>
            <h2 className="text-2xl font-bold tracking-tight">{t("staff.events.edit")}</h2>
          </div>
          <p className="text-muted-foreground mt-1">{t("staff.events.editDescription")}</p>
        </div>
      </div>
      <Separator />

      <EventForm churchId={churchId} initialData={event} isEditMode />
    </div>
  )
}
