"use client"

import * as React from "react"
import { type getMembers } from "@/actions/member"

import { useDataTable } from "@/hooks/use-data-table"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"

import { getColumns } from "./member-table-columns"
import { MemberTableToolbarActions } from "./member-table-toolbar-actions"

interface MemberTableProps {
  memberPromise: ReturnType<typeof getMembers>
  churchId: string
}

export function MemberTable({ memberPromise, churchId }: MemberTableProps) {
  const { members, pageCount = 1 } = React.use(memberPromise)
  const columns = React.useMemo(() => getColumns(churchId), [churchId])

  const { table } = useDataTable({
    data: members,
    columns,
    pageCount,
    defaultPerPage: 10,
    defaultSort: "createdAt.desc",
  })

  return (
    <div className="max-w-auto space-y-2.5 overflow-auto">
      <DataTableToolbar table={table}>
        <MemberTableToolbarActions table={table} />
      </DataTableToolbar>
      <DataTable table={table} />
    </div>
  )
}
