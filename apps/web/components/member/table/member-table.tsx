"use client"

import * as React from "react"
import { type getMembers } from "@/actions/member"

import { useDataTable } from "@/hooks/use-data-table"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
import { UnavailableState } from "@/components/ui/unavailable-state"
import { useT } from "@/components/i18n/locale-provider"

import { getColumns } from "./member-table-columns"
import { MemberTableToolbarActions } from "./member-table-toolbar-actions"

interface MemberTableProps {
  memberPromise: ReturnType<typeof getMembers>
  churchId: string
  emptyMessage?: string
}

export function MemberTable({
  memberPromise,
  churchId,
  emptyMessage,
}: MemberTableProps) {
  const { t } = useT()
  const result = React.use(memberPromise)
  if (result.status === "unavailable") {
    return (
      <UnavailableState
        title={t("component.members.unavailableTitle")}
        message={result.message}
      />
    )
  }

  const { members, pageCount = 1 } = result
  const columns = React.useMemo(() => getColumns(churchId, t), [churchId, t])

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
      <DataTable table={table} emptyMessage={emptyMessage} />
    </div>
  )
}
