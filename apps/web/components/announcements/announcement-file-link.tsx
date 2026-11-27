"use client"

import { useState } from "react"
import { FileText } from "lucide-react"

import { useT } from "@/components/i18n/locale-provider"
import { getAnnouncementAttachmentUrl } from "./announcement-actions"

// The signed URL is requested when the member clicks, so it is fresh and never sits in the page.
export function AnnouncementFileLink({
  churchId,
  attachmentId,
  name,
}: {
  churchId: string
  attachmentId: string
  name: string | null
}) {
  const { t } = useT()
  const [status, setStatus] = useState<"idle" | "pending" | "error">("idle")

  async function download() {
    setStatus("pending")
    const result = await getAnnouncementAttachmentUrl(churchId, attachmentId).catch(() => null)
    if (!result || result.status !== "ok") {
      setStatus("error")
      return
    }
    const link = document.createElement("a")
    link.href = result.url
    link.target = "_blank"
    link.rel = "noopener noreferrer"
    link.click()
    setStatus("idle")
  }

  return (
    <div>
      <button
        type="button"
        onClick={download}
        disabled={status === "pending"}
        className="border-border bg-background hover:bg-muted flex w-full items-center justify-between gap-3 rounded-md border px-4 py-3 text-left text-sm disabled:opacity-60"
      >
        <span className="flex min-w-0 items-center gap-2">
          <FileText className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
          <span className="text-foreground truncate">
            {name ?? t("member.content.announcements.files.unnamed")}
          </span>
        </span>
        <span className="text-primary shrink-0 text-xs font-medium">
          {t("member.content.announcements.files.download")}
        </span>
      </button>
      {status === "error" ? (
        <p role="alert" className="text-destructive mt-1 text-xs">
          {t("member.content.announcements.files.unavailable")}
        </p>
      ) : null}
    </div>
  )
}
