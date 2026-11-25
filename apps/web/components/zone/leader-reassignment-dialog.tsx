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
import { useT } from "@/components/i18n/locale-provider"

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
  const { t } = useT()

  // Filter out the current member and only show non-leaders
  const replacementCandidates = availableMembers.filter(
    m => m.id !== memberId && !m.isLeader
  )

  const handleRemoveLeader = async () => {
    if (!selectedLeaderId) {
      toast.error(t("staff.zones.selectReplacementError"))
      return
    }

    setIsRemoving(true)
    try {
      await unassignMemberFromZone(zoneId, memberId, churchId, selectedLeaderId)
      toast.success(t("staff.zones.leaderReplaced"))
      
      setSelectedLeaderId("")
      onOpenChange(false)
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("staff.groups.removeError"))
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("staff.zones.removeLeaderTitle")}</DialogTitle>
          <DialogDescription>
            {t("staff.zones.removeLeaderDescription", { name: memberName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Leader Info */}
          <div className="rounded-lg border p-3 bg-muted/50">
            <p className="text-sm font-medium text-muted-foreground mb-1">{t("staff.groups.currentLeader")}</p>
            <p className="font-semibold">{memberName}</p>
          </div>

          {/* Replacement Leader Selection */}
          {replacementCandidates.length > 0 ? (
            <div className="space-y-2">
              <Label htmlFor="replacement-leader">{t("staff.groups.selectNewLeader")}</Label>
              <Select value={selectedLeaderId} onValueChange={setSelectedLeaderId}>
                <SelectTrigger id="replacement-leader">
                  <SelectValue placeholder={t("staff.groups.chooseReplacement")} />
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
                {t("staff.zones.noReplacement")}
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
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveLeader}
              disabled={!selectedLeaderId || isRemoving || replacementCandidates.length === 0}
            >
              {isRemoving ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  {t("staff.groups.removing")}
                </>
              ) : (
                <>
                  <UserMinus className="mr-2 h-4 w-4" />
                  {t("staff.groups.removeLeader")}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
