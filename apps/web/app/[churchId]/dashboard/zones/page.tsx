import React from "react"
import Link from "next/link"
import { getZones } from "@/actions/zone"
import { getTranslator } from "@/lib/i18n/server"

import { Button } from "@/components/ui/button"
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import { ZoneTable } from "@/components/zone/table/zone-table"
import { ZonesTableProvider } from "@/components/zone/table/zone-table-provider"
import { Separator } from "@/components/ui/separator"

interface PageProps {
  params: Promise<{
    churchId: string
  }>
}

export default async function ZonesPage({ params }: PageProps) {
  const { churchId } = await params
  const zonePromise = getZones(churchId)
  const t = await getTranslator()

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("staff.zones.title")}</h2>
          <p className="text-muted-foreground">
            {t("staff.zones.description")}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href={`/${churchId}/dashboard/zones/add`}>
            <Button>{t("staff.zones.add")}</Button>
          </Link>
        </div>
      </div>
      <Separator />

      <ZonesTableProvider>
        <React.Suspense
          fallback={
            <DataTableSkeleton
              columnCount={3}
              searchableColumnCount={2}
              filterableColumnCount={1}
              cellWidths={["10rem", "40rem", "12rem", "12rem", "8rem"]}
              shrinkZero
            />
          }
        >
          <ZoneTable zonePromise={zonePromise} churchId={churchId} />
        </React.Suspense>
      </ZonesTableProvider>
    </div>
  )
}
