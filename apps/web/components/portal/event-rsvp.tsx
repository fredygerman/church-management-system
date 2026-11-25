"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { setMyRsvp } from "@/actions/event"

import { Button } from "@/components/ui/button"
import { useT } from "@/components/i18n/locale-provider"

const OPTIONS = [
  { status: "going" as const, labelKey: "component.rsvp.going" as const },
  { status: "maybe" as const, labelKey: "component.rsvp.maybe" as const },
  { status: "declined" as const, labelKey: "component.rsvp.declined" as const },
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
  const { t } = useT()
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
        message: t("component.rsvp.saved", { name: eventName }),
      })
      router.refresh()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("component.rsvp.fallback")
      const isPermissionError =
        /permission|forbidden|not authorized|unauthori[sz]ed|denied/i.test(
          message
        )
      setFeedback({
        kind: "error",
        message: isPermissionError
          ? t("component.rsvp.permission")
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
        aria-label={t("component.rsvp.optionsAria", { name: eventName })}
      >
        {OPTIONS.map((option) => {
          const label = t(option.labelKey)
          return (
            <Button
              key={option.status}
              type="button"
              size="sm"
              variant={currentStatus === option.status ? "default" : "outline"}
              disabled={pending !== null}
              onClick={() => respond(option.status)}
              aria-label={t("component.rsvp.optionAria", { option: label, name: eventName })}
            >
              {pending === option.status ? t("common.saving") : label}
            </Button>
          )
        })}
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
