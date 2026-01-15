import React from "react"
import { getZoneById } from "@/actions/zone"
import { ZoneForm } from "@/components/form/ZoneForm"
import { Separator } from "@/components/ui/separator"

interface PageProps {
  params: Promise<{ churchId: string; id: string }>
}

export default async function EditZonePage({ params }: PageProps) {
  const { churchId, id } = await params
  const zone = await getZoneById(id)

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <a href={`/${churchId}/dashboard/zones`} className="text-blue-600 hover:underline">
              Zones
            </a>
            <span className="text-muted-foreground">/</span>
            <h2 className="text-2xl font-bold tracking-tight">Edit Zone</h2>
          </div>
          <p className="text-muted-foreground mt-1">Edit zone details</p>
        </div>
      </div>
      <Separator />

      <ZoneForm churchId={churchId} initialData={zone} isEditMode />
    </div>
  )
}
