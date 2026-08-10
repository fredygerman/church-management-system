"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { setMyRsvp } from "@/actions/event"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const OPTIONS = [
  { status: "going" as const, label: "Going" },
  { status: "maybe" as const, label: "Maybe" },
  { status: "declined" as const, label: "Declined" },
]

interface RsvpButtonsProps {
  churchId: string
  eventId: string
  currentStatus?: string | null
}

export function RsvpButtons({ churchId, eventId, currentStatus }: RsvpButtonsProps) {
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)

  async function respond(status: "going" | "maybe" | "declined") {
    setPending(status)
    try {
      await setMyRsvp({ churchId, eventId, status })
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to RSVP")
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="flex gap-2">
      {OPTIONS.map((option) => (
        <Button
          key={option.status}
          type="button"
          size="sm"
          variant={currentStatus === option.status ? "default" : "outline"}
          disabled={pending !== null}
          onClick={() => respond(option.status)}
          className={cn(currentStatus === option.status && "pointer-events-none")}
        >
          {pending === option.status ? "..." : option.label}
        </Button>
      ))}
    </div>
  )
}
