"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { setEventAttendance } from "@/actions/event"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface RosterRow {
  id: string
  memberId: string
  memberName: string
  status: string
  attended: boolean
}

interface AttendanceFormProps {
  churchId: string
  eventId: string
  roster: RosterRow[]
  initialHeadcount?: number | null
}

export function AttendanceForm({ churchId, eventId, roster, initialHeadcount }: AttendanceFormProps) {
  const router = useRouter()
  const [attended, setAttended] = useState<Set<string>>(
    new Set(roster.filter((row) => row.attended).map((row) => row.memberId))
  )
  const [headcount, setHeadcount] = useState<string>(
    initialHeadcount !== null && initialHeadcount !== undefined ? String(initialHeadcount) : ""
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  function toggle(memberId: string) {
    setAttended((prev) => {
      const next = new Set(prev)
      if (next.has(memberId)) next.delete(memberId)
      else next.add(memberId)
      return next
    })
  }

  async function onSubmit() {
    setIsSubmitting(true)
    try {
      await setEventAttendance({
        churchId,
        eventId,
        attendedMemberIds: Array.from(attended),
        headcount: headcount ? Number(headcount) : undefined,
      })
      toast.success("Attendance saved")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save attendance")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {roster.length === 0 ? (
        <p className="text-sm text-muted-foreground">No RSVPs to mark attendance for yet.</p>
      ) : (
        <ul className="space-y-2">
          {roster.map((row) => (
            <li key={row.id} className="flex items-center gap-3 rounded-md border border-border p-2">
              <Checkbox
                id={`attended-${row.memberId}`}
                checked={attended.has(row.memberId)}
                onCheckedChange={() => toggle(row.memberId)}
              />
              <Label htmlFor={`attended-${row.memberId}`} className="flex-1 cursor-pointer">
                {row.memberName}
              </Label>
              <span className="text-xs capitalize text-muted-foreground">{row.status}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="headcount">Headcount (optional)</Label>
          <Input
            id="headcount"
            type="number"
            min="0"
            placeholder="e.g. 500"
            value={headcount}
            onChange={(e) => setHeadcount(e.target.value)}
            className="w-40"
          />
        </div>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Attendance"}
        </Button>
      </div>
    </div>
  )
}
