import React from "react"
import { getZoneById } from "@/actions/zone"
import { ZoneForm } from "@/components/form/ZoneForm"
import { Separator } from "@/components/ui/separator"
import { getTranslator } from "@/lib/i18n/server"

interface PageProps {
  params: Promise<{ churchId: string; id: string }>
}

export default async function EditZonePage({ params }: PageProps) {
  const { churchId, id } = await params
  const zone = await getZoneById(churchId, id)
  const t = await getTranslator()

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <a href={`/${churchId}/dashboard/zones`} className="text-blue-600 hover:underline">
              {t("staff.zones.title")}
            </a>
            <span className="text-muted-foreground">/</span>
            <h2 className="text-2xl font-bold tracking-tight">{t("staff.zones.edit")}</h2>
          </div>
          <p className="text-muted-foreground mt-1">{t("staff.zones.editDescription")}</p>
        </div>
      </div>
      <Separator />

      <ZoneForm churchId={churchId} initialData={zone} isEditMode />
    </div>
  )
}
