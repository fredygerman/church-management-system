"use client"

import { useState } from "react"

import { getLibraryDownloadUrl } from "@/actions/library"
import type { LibraryDocument } from "@/actions/library"
import { Button } from "@/components/ui/button"

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "Unknown size"
  if (bytes < 1024) return `${bytes} B`

  const units = ["KB", "MB", "GB", "TB"]
  let value = bytes
  let unitIndex = -1

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`
}

function formatFileType(document: LibraryDocument): string {
  const extension = document.original_file_name?.split(".").pop()
  if (extension && extension !== document.original_file_name) {
    return extension.toUpperCase()
  }

  return document.content_type?.split("/").pop()?.toUpperCase() || "FILE"
}

export function LibraryDocumentList({
  churchId,
  documents,
}: {
  churchId: string
  documents: LibraryDocument[]
}) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  async function handleDownload(document: LibraryDocument) {
    setDownloadingId(document.id)
    setDownloadError(null)

    try {
      const result = await getLibraryDownloadUrl(churchId, document.id)

      if (result.status === "unavailable") {
        setDownloadError(result.message)
        return
      }

      const link = window.document.createElement("a")
      link.href = result.url
      link.target = "_blank"
      link.rel = "noopener noreferrer"
      link.click()
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <ul className="space-y-3">
      {documents.map((document) => (
        <li
          key={document.id}
          className="border-border bg-card flex flex-col gap-4 rounded-lg border p-5 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="min-w-0">
            <h2 className="text-foreground font-medium">{document.title}</h2>
            {document.description ? (
              <p className="text-muted-foreground mt-2 whitespace-pre-wrap text-sm">
                {document.description}
              </p>
            ) : null}
            <p className="text-muted-foreground mt-3 text-xs">
              {formatFileType(document)} · {formatBytes(document.size_bytes)}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            disabled={downloadingId === document.id}
            aria-label={`Download ${document.title}`}
            onClick={() => handleDownload(document)}
          >
            {downloadingId === document.id ? "Preparing…" : "Download"}
          </Button>
        </li>
      ))}
      {downloadError ? (
        <li className="border-destructive/50 bg-card rounded-lg border p-4" role="alert">
          <p className="text-destructive text-sm">{downloadError}</p>
        </li>
      ) : null}
    </ul>
  )
}
