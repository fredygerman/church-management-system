"use client"

import { useState, useTransition } from "react"

import { createLibraryResourceAccess, updateLibraryResourceProgress } from "@/actions/library-resources"
import { useT } from "@/components/i18n/locale-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ResourceActions({
  churchId,
  resourceId,
  isMedia,
  initialPositionSeconds,
  initialPageNumber,
}: {
  churchId: string
  resourceId: string
  isMedia: boolean
  initialPositionSeconds: number
  initialPageNumber: number | null
}) {
  const { t } = useT()
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [position, setPosition] = useState(String(initialPositionSeconds))
  const [page, setPage] = useState(initialPageNumber == null ? "" : String(initialPageNumber))

  function open() {
    setMessage(null)
    startTransition(async () => {
      const result = await createLibraryResourceAccess(churchId, resourceId)
      if (result.status === "unavailable") {
        setMessage(result.message)
        return
      }
      // Short-lived URL: opened once, not stored.
      window.open(result.data.url, "_blank", "noopener,noreferrer")
    })
  }

  function save() {
    setMessage(null)
    startTransition(async () => {
      const result = await updateLibraryResourceProgress(churchId, resourceId, {
        positionSeconds: isMedia ? Math.max(0, Math.floor(Number(position) || 0)) : undefined,
        pageNumber: isMedia ? undefined : page === "" ? null : Math.max(1, Math.floor(Number(page) || 1)),
      })
      setMessage(result.status === "ok" ? t("wiring.library.resource.progressSaved") : result.message)
    })
  }

  return (
    <div className="space-y-6">
      <Button type="button" onClick={open} disabled={pending}>
        {t("wiring.library.resource.access")}
      </Button>

      <section className="border-border bg-card space-y-3 rounded-lg border p-5">
        <h2 className="text-foreground font-medium">{t("wiring.library.resource.progressTitle")}</h2>
        <label className="block text-sm">
          {isMedia ? t("wiring.library.resource.positionSeconds") : t("wiring.library.resource.pageNumber")}
          <Input
            type="number"
            min={isMedia ? 0 : 1}
            value={isMedia ? position : page}
            onChange={(event) => (isMedia ? setPosition(event.target.value) : setPage(event.target.value))}
            className="mt-1 max-w-xs"
          />
        </label>
        <Button type="button" variant="outline" onClick={save} disabled={pending}>
          {t("wiring.library.resource.saveProgress")}
        </Button>
      </section>

      {message ? (
        <p role="status" className="text-muted-foreground text-sm">
          {message}
        </p>
      ) : null}
    </div>
  )
}
