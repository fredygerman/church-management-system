"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { createPrayerRequest } from "@/actions/prayer"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export function PrayerRequestForm({ churchId }: { churchId: string }) {
  const router = useRouter()
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!content.trim()) return

    setIsSubmitting(true)
    try {
      await createPrayerRequest(churchId, content.trim())
      toast.success("Prayer request submitted")
      setContent("")
      router.refresh()
    } catch (error) {
      console.error("Error submitting prayer request:", error)
      toast.error(error instanceof Error ? error.message : "Failed to submit prayer request")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Share what you'd like the church to pray for..."
        rows={4}
        disabled={isSubmitting}
        required
      />
      <Button type="submit" disabled={isSubmitting || !content.trim()}>
        {isSubmitting ? "Submitting..." : "Submit Prayer Request"}
      </Button>
    </form>
  )
}
