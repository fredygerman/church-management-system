"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { type getZoneMembers, assignMemberToZone, unassignMemberFromZone, getZoneById } from "@/actions/zone"

import { useDataTable } from "@/hooks/use-data-table"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
import { LeaderReassignmentDialog } from "../leader-reassignment-dialog"

import { getZoneMembersColumns } from "./zone-members-table-columns"
import { toast } from "sonner"

interface ZoneMembersTableProps {
  membersPromise: ReturnType<typeof getZoneMembers>
  churchId: string
  zoneId: string
  zone?: any
}

export function ZoneMembersTable({ membersPromise, churchId, zoneId, zone }: ZoneMembersTableProps) {
  const { members, pageCount = 1 } = React.use(membersPromise)
  const router = useRouter()
  const [reassignmentDialog, setReassignmentDialog] = React.useState<{
    open: boolean
    memberId?: string
    memberName?: string
  }>({ open: false })

  // Handlers to call server actions
  const onAssignLeader = async (memberId: string) => {
    try {
      await assignMemberToZone(zoneId, memberId, true, churchId)
      toast.success("Leader assigned")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to assign leader")
    }
  }

  const onUnassign = async (memberId: string) => {
    const member = members.find(m => m.id === memberId)
    const isLeader = (member as any)?.isLeader

    // If removing a leader, show reassignment dialog
    if (isLeader && zone?.leaderId === memberId) {
      setReassignmentDialog({
        open: true,
        memberId,
        memberName: `${member?.firstName} ${member?.lastName}`,
      })
      return
    }

    // Otherwise, show confirmation and remove
    const confirmed = window.confirm("Remove member from this zone?")
    if (!confirmed) return

    try {
      await unassignMemberFromZone(zoneId, memberId, churchId, undefined)
      toast.success("Member removed from zone")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove member")
    }
  }

  const columns = React.useMemo(() => getZoneMembersColumns(churchId, { onAssignLeader, onUnassign }), [churchId])

  const { table } = useDataTable({
    data: members,
    columns,
    pageCount,
    defaultPerPage: 10,
    defaultSort: "firstName.asc",
  })

  return (
    <>
      <div className="max-w-auto space-y-2.5 overflow-auto">
        <DataTableToolbar table={table} />
        <DataTable table={table} />
      </div>

      {/* Leader Reassignment Dialog */}
      {reassignmentDialog.memberId && reassignmentDialog.memberName && (
        <LeaderReassignmentDialog
          open={reassignmentDialog.open}
          onOpenChange={(open) => setReassignmentDialog({ open })}
          memberId={reassignmentDialog.memberId}
          memberName={reassignmentDialog.memberName}
          zoneId={zoneId}
          churchId={churchId}
          availableMembers={members}
          onSuccess={() => setReassignmentDialog({ open: false })}
        />
      )}
    </>
  )
}
