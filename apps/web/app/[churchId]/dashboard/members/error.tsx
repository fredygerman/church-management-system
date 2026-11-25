"use client"

import { useEffect } from "react"

import { Button } from "@/components/ui/button"
import { useT } from "@/components/i18n/locale-provider"

export default function MembersError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useT()
  useEffect(() => {
    console.error("Error loading members:", error)
  }, [error])

  return (
    <div className="border-destructive/50 rounded-md border p-5" role="alert">
      <p className="text-destructive text-sm">
        {error.message || t("final.error.membersFallback")}
      </p>
      <Button variant="outline" className="mt-4" onClick={() => reset()}>
        {t("common.retry")}
      </Button>
    </div>
  )
}
