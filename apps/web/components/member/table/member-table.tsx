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
}

export function MemberTable({ memberPromise }: MemberTableProps) {
  const { members, pageCount = 1 } = React.use(memberPromise)
  console.log("member table members", members)
  console.log("member table pageCount", pageCount)
  const columns = React.useMemo(() => getColumns(), [])

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
