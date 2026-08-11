"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { type getDepartmentMembers, assignMemberToDepartment, removeMemberFromDepartment, addDepartmentLeader, removeDepartmentLeader } from "@/actions/department"

import { useDataTable } from "@/hooks/use-data-table"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"

import { getDepartmentMembersColumns } from "./department-members-table-columns"
import { toast } from "sonner"

interface DepartmentMembersTableProps {
  membersPromise: ReturnType<typeof getDepartmentMembers>
  churchId: string
  departmentId: string
}

export function DepartmentMembersTable({
  membersPromise,
  churchId,
  departmentId,
}: DepartmentMembersTableProps) {
  const { members, pageCount = 1 } = React.use(membersPromise)
  const router = useRouter()

  // Handler to toggle leader status (make leader or remove leader)
  const onToggleLeader = React.useCallback(async (memberId: string, makeLeader: boolean) => {
    try {
      if (makeLeader) {
        await addDepartmentLeader(departmentId, memberId, churchId)
        toast.success("Member promoted to leader")
      } else {
        await removeDepartmentLeader(departmentId, memberId, churchId)
        toast.success("Leader status removed")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update leader status")
    }
  }, [departmentId, churchId])

  const onRemove = React.useCallback(async (memberId: string) => {
    const confirmed = window.confirm("Remove member from this department?")
    if (!confirmed) return

    try {
      await removeMemberFromDepartment(departmentId, memberId, churchId)
      toast.success("Member removed from department")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove member")
    }
  }, [departmentId, churchId])

  const columns = React.useMemo(
    () => getDepartmentMembersColumns(churchId, { onToggleLeader, onRemove }),
    [churchId, onToggleLeader, onRemove]
  )

  const { table } = useDataTable({
    data: members,
    columns,
    pageCount,
    defaultPerPage: 10,
    defaultSort: "firstName.asc",
  })

  return (
    <div className="max-w-auto space-y-2.5 overflow-auto">
      <DataTableToolbar table={table} />
      <DataTable table={table} />
    </div>
  )
}
