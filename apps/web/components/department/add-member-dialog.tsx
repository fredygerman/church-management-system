"use client"

import * as React from "react"
import { searchMembers } from "@/actions/member"
import { assignMemberToDepartment } from "@/actions/department"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Loader, Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useT } from "@/components/i18n/locale-provider"

interface AddMemberDialogProps {
  departmentId: string
  churchId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddMemberDialog({
  departmentId,
  churchId,
  open,
  onOpenChange,
  onSuccess,
}: AddMemberDialogProps) {
  const router = useRouter()
  const { t } = useT()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [members, setMembers] = React.useState<any[]>([])
  const [selectedMemberId, setSelectedMemberId] = React.useState("")
  const [isSearching, setIsSearching] = React.useState(false)
  const [isAssigning, setIsAssigning] = React.useState(false)

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      void (async () => {
        if (searchQuery.trim()) {
          setIsSearching(true)
          try {
            const results = await searchMembers(churchId, searchQuery)
            setMembers(results)
          } catch (error) {
            console.error("Error searching members:", error)
            toast.error(t("staff.groups.searchError"))
            setMembers([])
          } finally {
            setIsSearching(false)
          }
        } else {
          setMembers([])
        }
      })()
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, churchId])

  const handleAssign = async () => {
    if (!selectedMemberId) {
      toast.error(t("staff.groups.selectMemberError"))
      return
    }

    setIsAssigning(true)
    try {
      await assignMemberToDepartment(departmentId, selectedMemberId, false, churchId)
      toast.success(t("staff.departments.memberAdded"))

      // Reset form
      setSearchQuery("")
      setSelectedMemberId("")
      setMembers([])

      onOpenChange(false)

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("staff.groups.addError"))
    } finally {
      setIsAssigning(false)
    }
  }

  const selectedMember = members.find(m => m.id === selectedMemberId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("staff.departments.addMemberTitle")}</DialogTitle>
          <DialogDescription>
            {t("staff.departments.addMemberDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search">{t("staff.groups.searchMembers")}</Label>
            <div className="relative">
              <Input
                id="search"
                placeholder={t("staff.groups.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-8"
              />
              {isSearching && (
                <Loader className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Search Results */}
          {members.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="member-select">{t("staff.groups.selectMember")}</Label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger id="member-select">
                  <SelectValue placeholder={t("staff.groups.chooseMember")} />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex flex-col">
                        <span>
                          {member.firstName} {member.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {member.phone || t("staff.groups.noPhone")}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Selected Member Info */}
          {selectedMember && (
            <div className="rounded-lg border p-3 bg-muted/50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium">
                    {selectedMember.firstName} {selectedMember.lastName}
                  </p>
                  {selectedMember.phone && (
                    <p className="text-sm text-muted-foreground">
                      {selectedMember.phone}
                    </p>
                  )}
                  {selectedMember.gender && (
                    <p className="text-sm text-muted-foreground capitalize">
                      {selectedMember.gender}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedMemberId("")
                    setMembers([])
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isAssigning}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedMemberId || isAssigning}
            >
              {isAssigning ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  {t("staff.groups.adding")}
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("staff.groups.addMember")}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
