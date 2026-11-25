"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { getLibraryDownloadUrl } from "@/actions/library"
import { Button } from "@/components/ui/button"
import { useT } from "@/components/i18n/locale-provider"

type ReaderState =
  | { status: "loading" }
  | { status: "ready"; url: string; expiresAt: number }
  | { status: "expired" }
  | { status: "error"; message: string }

function viewKind(contentType: string): "pdf" | "image" | "other" {
  const normalized = contentType.split(";")[0].trim().toLowerCase()
  if (normalized === "application/pdf") return "pdf"
  if (normalized.startsWith("image/")) return "image"
  return "other"
}

export function LibraryReader({
  churchId,
  documentId,
  title,
  contentType,
}: {
  churchId: string
  documentId: string
  title: string
  contentType: string
}) {
  const { t } = useT()
  const [state, setState] = useState<ReaderState>({ status: "loading" })
  const requestRef = useRef(0)

  // The signed URL lives only in React state: never logged, never persisted.
  const fetchUrl = useCallback(async () => {
    const requestId = ++requestRef.current
    const result = await getLibraryDownloadUrl(churchId, documentId)
    if (requestId !== requestRef.current) return

    if (result.status === "unavailable") {
      setState({ status: "error", message: result.message })
      return
    }

    const expiresAt = Date.parse(result.expiresAt)
    setState({
      status: "ready",
      url: result.url,
      expiresAt: Number.isNaN(expiresAt) ? Infinity : expiresAt,
    })
  }, [churchId, documentId])

  useEffect(() => {
    void fetchUrl()
  }, [fetchUrl])

  useEffect(() => {
    if (state.status !== "ready" || !Number.isFinite(state.expiresAt)) return

    const timer = window.setTimeout(
      () => setState({ status: "expired" }),
      Math.max(state.expiresAt - Date.now(), 0)
    )
    return () => window.clearTimeout(timer)
  }, [state])

  function retry() {
    setState({ status: "loading" })
    void fetchUrl()
  }

  if (state.status === "loading") {
    return (
      <div
        className="border-border bg-card h-[70vh] animate-pulse rounded-lg border"
        aria-busy="true"
        aria-label={t("final.library.preparing")}
      />
    )
  }

  if (state.status === "expired" || state.status === "error") {
    const message =
      state.status === "expired"
        ? t("final.library.expired")
        : state.message

    return (
      <div className="border-destructive/50 bg-card rounded-lg border p-5" role="alert">
        <p className="text-destructive text-sm">{message}</p>
        <Button type="button" variant="outline" className="mt-4" onClick={retry}>
          {t("common.retry")}
        </Button>
      </div>
    )
  }

  const kind = viewKind(contentType)

  if (kind === "pdf") {
    return (
      <div className="space-y-3">
        <iframe
          src={state.url}
          title={title}
          className="border-border bg-card h-[75vh] w-full rounded-lg border"
        />
        <a
          href={state.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground text-sm underline-offset-4 hover:underline"
        >
          {t("final.library.openNewTab")}
        </a>
      </div>
    )
  }

  if (kind === "image") {
    return (
      <div className="space-y-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- signed storage URL, not optimizable */}
        <img
          src={state.url}
          alt={title}
          className="border-border bg-card mx-auto max-h-[75vh] w-auto max-w-full rounded-lg border object-contain"
          onError={() =>
            setState({
              status: "error",
              message: t("final.library.imageFailed"),
            })
          }
        />
        <a
          href={state.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground text-sm underline-offset-4 hover:underline"
        >
          {t("final.library.openNewTab")}
        </a>
      </div>
    )
  }

  return (
    <div className="border-border bg-card rounded-lg border p-5">
      <p className="text-muted-foreground text-sm">
        {t("final.library.cannotPreview")}
      </p>
      <Button asChild variant="outline" className="mt-4">
        <a href={state.url} target="_blank" rel="noopener noreferrer">
          {t("final.library.download")}
        </a>
      </Button>
    </div>
  )
}
