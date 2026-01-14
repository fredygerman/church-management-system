"use client"

import * as React from "react"
import { type getZones } from "@/actions/zone"

import { useDataTable } from "@/hooks/use-data-table"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"

import { getColumns } from "./zone-table-columns"
import { ZoneTableToolbarActions } from "./zone-table-toolbar-actions"

interface ZoneTableProps {
  zonePromise: ReturnType<typeof getZones>
  churchId: string
}

export function ZoneTable({ zonePromise, churchId }: ZoneTableProps) {
  const zones = React.use(zonePromise)
  const columns = React.useMemo(() => getColumns(churchId), [churchId])

  const { table } = useDataTable({
    data: zones,
    columns,
    pageCount: 1,
    defaultPerPage: 10,
    defaultSort: "createdAt.desc",
  })

  return (
    <div className="max-w-auto space-y-2.5 overflow-auto">
      <DataTableToolbar table={table}>
        <ZoneTableToolbarActions table={table} />
      </DataTableToolbar>
      <DataTable table={table} />
    </div>
  )
}
