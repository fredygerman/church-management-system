"use client"

import * as React from "react"
import { type getDepartments } from "@/actions/department"

import { useDataTable } from "@/hooks/use-data-table"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
import { useT } from "@/components/i18n/locale-provider"

import { getDepartmentColumns } from "./department-table-columns"
import { DepartmentTableToolbarActions } from "./department-table-toolbar-actions"

interface DepartmentTableProps {
  departmentsPromise: ReturnType<typeof getDepartments>
  churchId: string
}

export function DepartmentTable({ departmentsPromise, churchId }: DepartmentTableProps) {
  const departments = React.use(departmentsPromise)
  const { t, locale } = useT()
  const columns = React.useMemo(() => getDepartmentColumns(churchId, t, locale), [churchId, t, locale])

  const { table } = useDataTable({
    data: departments,
    columns,
    pageCount: 1,
    defaultPerPage: 10,
    defaultSort: "createdAt.desc",
  })

  return (
    <div className="max-w-auto space-y-2.5 overflow-auto">
      <DataTableToolbar table={table}>
        <DepartmentTableToolbarActions table={table} />
      </DataTableToolbar>
      <DataTable table={table} />
    </div>
  )
}
