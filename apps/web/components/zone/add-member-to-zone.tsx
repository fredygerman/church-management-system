"use client"

import * as React from "react"
import { Check, ChevronsUpDown, UserPlus } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { assignMemberToZone } from "@/actions/zone"

interface Member {
  id: string
  firstName: string
  lastName: string
  phone?: string
}

interface AddMemberToZoneProps {
  churchId: string
  zoneId: string
  availableMembers: Member[]
  onMemberAdded?: () => void
}

export function AddMemberToZone({ 
  churchId,
  zoneId, 
  availableMembers, 
  onMemberAdded 
}: AddMemberToZoneProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedMember, setSelectedMember] = React.useState<Member | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleAddMember = async () => {
    if (!selectedMember) return

    setIsLoading(true)
    try {
      await assignMemberToZone(zoneId, selectedMember.id, false, churchId) // Not a leader by default
      toast.success(`${selectedMember.firstName} ${selectedMember.lastName} added to zone`)
      setSelectedMember(null)
      setOpen(false)
      onMemberAdded?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add member")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[300px] justify-between"
          >
            {selectedMember
              ? `${selectedMember.firstName} ${selectedMember.lastName}`
              : "Search members..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search members..." />
            <CommandEmpty>No members found.</CommandEmpty>
            <CommandGroup>
              {availableMembers.map((member) => (
                <CommandItem
                  key={member.id}
                  value={`${member.firstName} ${member.lastName} ${member.phone || ''}`}
                  onSelect={() => {
                    setSelectedMember(member)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedMember?.id === member.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{member.firstName} {member.lastName}</span>
                    {member.phone && (
                      <span className="text-sm text-muted-foreground">{member.phone}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      <Button
        onClick={handleAddMember}
        disabled={!selectedMember || isLoading}
        size="sm"
      >
        <UserPlus className="mr-2 h-4 w-4" />
        {isLoading ? "Adding..." : "Add Member"}
      </Button>
    </div>
  )
}
