"use client"

import * as React from "react"
import { toast } from "sonner"
import { Loader, UserMinus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { unassignMemberFromZone } from "@/actions/zone"

interface LeaderReassignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  memberId: string
  memberName: string
  zoneId: string
  churchId: string
  availableMembers: Array<{
    id: string
    firstName: string
    lastName: string
    isLeader?: boolean
  }>
  onSuccess?: () => void
}

export function LeaderReassignmentDialog({
  open,
  onOpenChange,
  memberId,
  memberName,
  zoneId,
  churchId,
  availableMembers,
  onSuccess,
}: LeaderReassignmentDialogProps) {
  const [selectedLeaderId, setSelectedLeaderId] = React.useState("")
  const [isRemoving, setIsRemoving] = React.useState(false)

  // Filter out the current member and only show non-leaders
  const replacementCandidates = availableMembers.filter(
    m => m.id !== memberId && !m.isLeader
  )

  const handleRemoveLeader = async () => {
    if (!selectedLeaderId) {
      toast.error("Please select a replacement leader")
      return
    }

    setIsRemoving(true)
    try {
      await unassignMemberFromZone(zoneId, memberId, churchId, selectedLeaderId)
      toast.success("Member removed and new leader assigned")
      
      setSelectedLeaderId("")
      onOpenChange(false)
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove member")
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove Leader from Zone</DialogTitle>
          <DialogDescription>
            {memberName} is currently a zone leader. Please select a replacement leader before removing them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Leader Info */}
          <div className="rounded-lg border p-3 bg-muted/50">
            <p className="text-sm font-medium text-muted-foreground mb-1">Current Leader</p>
            <p className="font-semibold">{memberName}</p>
          </div>

          {/* Replacement Leader Selection */}
          {replacementCandidates.length > 0 ? (
            <div className="space-y-2">
              <Label htmlFor="replacement-leader">Select New Leader</Label>
              <Select value={selectedLeaderId} onValueChange={setSelectedLeaderId}>
                <SelectTrigger id="replacement-leader">
                  <SelectValue placeholder="Choose a replacement leader..." />
                </SelectTrigger>
                <SelectContent>
                  {replacementCandidates.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.firstName} {member.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
              <p className="text-sm text-destructive">
                No other members available to be assigned as leader. Please add more members to the zone first.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveLeader}
              disabled={!selectedLeaderId || isRemoving || replacementCandidates.length === 0}
            >
              {isRemoving ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <UserMinus className="mr-2 h-4 w-4" />
                  Remove Leader
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
