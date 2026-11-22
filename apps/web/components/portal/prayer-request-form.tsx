"use client"

import { useState } from "react"
import { createPrayerRequest } from "@/actions/prayer"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function PortalPrayerRequestForm({ churchId }: { churchId: string }) {
  const [content, setContent] = useState("")
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error"
    message: string
  } | null>(null)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedContent = content.trim()
    setFeedback(null)

    if (!trimmedContent) {
      setFeedback({ kind: "error", message: "Prayer request is required." })
      return
    }

    setPending(true)
    try {
      await createPrayerRequest(churchId, trimmedContent)
      setContent("")
      setFeedback({
        kind: "success",
        message: "Your prayer request was submitted.",
      })
    } catch (error) {
      setFeedback({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "We could not submit your prayer request.",
      })
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="portal-prayer-request">Prayer request</Label>
        <Textarea
          id="portal-prayer-request"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Share what you would like the church to pray for..."
          rows={4}
          disabled={pending}
          aria-describedby="portal-prayer-privacy"
        />
      </div>
      <p id="portal-prayer-privacy" className="text-muted-foreground text-xs">
        Your request follows the church&apos;s existing privacy rules.
      </p>
      {feedback && (
        <p
          role={feedback.kind === "error" ? "alert" : "status"}
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
      <Button type="submit" disabled={pending}>
        {pending ? "Submitting..." : "Submit prayer request"}
      </Button>
    </form>
  )
}
