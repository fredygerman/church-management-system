"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { setMyRsvp } from "@/actions/event"

import { Button } from "@/components/ui/button"

const OPTIONS = [
  { status: "going" as const, label: "Going" },
  { status: "maybe" as const, label: "Maybe" },
  { status: "declined" as const, label: "Declined" },
]

interface EventRsvpProps {
  churchId: string
  eventId: string
  eventName: string
  currentStatus?: string | null
}

export function EventRsvp({
  churchId,
  eventId,
  eventName,
  currentStatus,
}: EventRsvpProps) {
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error"
    message: string
  } | null>(null)

  async function respond(status: "going" | "maybe" | "declined") {
    setPending(status)
    setFeedback(null)

    try {
      await setMyRsvp({ churchId, eventId, status })
      setFeedback({
        kind: "success",
        message: `Your RSVP for ${eventName} was saved.`,
      })
      router.refresh()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "We could not save your RSVP."
      const isPermissionError =
        /permission|forbidden|not authorized|unauthori[sz]ed|denied/i.test(
          message
        )
      setFeedback({
        kind: "error",
        message: isPermissionError
          ? "You do not have permission to RSVP for this event."
          : message,
      })
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="space-y-3">
      <div
        className="flex flex-wrap gap-2"
        aria-label={`RSVP options for ${eventName}`}
      >
        {OPTIONS.map((option) => (
          <Button
            key={option.status}
            type="button"
            size="sm"
            variant={currentStatus === option.status ? "default" : "outline"}
            disabled={pending !== null}
            onClick={() => respond(option.status)}
            aria-label={`${option.label} for ${eventName}`}
          >
            {pending === option.status ? "Saving..." : option.label}
          </Button>
        ))}
      </div>
      {feedback && (
        <p
          role="status"
          aria-live="polite"
          className={
            feedback.kind === "error"
              ? "text-destructive text-sm"
              : "text-primary text-sm"
          }
        >
          {feedback.message}
        </p>
      )}
    </div>
  )
}
