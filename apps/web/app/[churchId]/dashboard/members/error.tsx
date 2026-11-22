"use client"

import { useEffect } from "react"

import { Button } from "@/components/ui/button"

export default function MembersError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Error loading members:", error)
  }, [error])

  return (
    <div className="border-destructive/50 rounded-md border p-5" role="alert">
      <p className="text-destructive text-sm">
        {error.message || "Members could not be loaded."}
      </p>
      <Button variant="outline" className="mt-4" onClick={() => reset()}>
        Retry
      </Button>
    </div>
  )
}
