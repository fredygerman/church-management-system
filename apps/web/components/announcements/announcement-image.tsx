"use client"

import { useEffect, useState } from "react"

import { useT } from "@/components/i18n/locale-provider"
import { getAnnouncementAttachmentUrl } from "./announcement-actions"

type ImageState = { status: "loading" } | { status: "ready"; url: string } | { status: "error" }

// Resolves the signed URL on mount. Callers key this component by attachmentId.
export function AnnouncementImage({
  churchId,
  attachmentId,
  alt,
}: {
  churchId: string
  attachmentId: string
  alt: string
}) {
  const { t } = useT()
  const [state, setState] = useState<ImageState>({ status: "loading" })

  useEffect(() => {
    let active = true
    getAnnouncementAttachmentUrl(churchId, attachmentId)
      .then((result) => {
        if (!active) return
        setState(result.status === "ok" ? { status: "ready", url: result.url } : { status: "error" })
      })
      .catch(() => {
        if (active) setState({ status: "error" })
      })
    return () => {
      active = false
    }
  }, [churchId, attachmentId])

  if (state.status === "loading") {
    return <div className="border-border bg-card h-48 animate-pulse rounded-lg border" aria-busy="true" />
  }

  if (state.status === "error") {
    return (
      <p className="border-border bg-muted text-muted-foreground rounded-lg border px-4 py-3 text-sm">
        {t("member.content.announcements.image.unavailable")}
      </p>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- signed storage URL, not optimizable
    <img
      src={state.url}
      alt={alt.trim() !== "" ? alt : t("member.content.announcements.image.fallbackAlt")}
      loading="lazy"
      referrerPolicy="no-referrer"
      className="border-border max-h-[70vh] w-full rounded-lg border object-contain"
      onError={() => setState({ status: "error" })}
    />
  )
}
