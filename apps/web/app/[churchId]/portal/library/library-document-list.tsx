"use client"

import { useMemo, useState } from "react"
import Link from "next/link"

import { getLibraryDownloadUrl } from "@/actions/library"
import type { LibraryDocument } from "@/actions/library"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatBytes, formatFileType } from "./library-format"

export function LibraryDocumentList({
  churchId,
  documents,
}: {
  churchId: string
  documents: LibraryDocument[]
}) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  // Client-side filter over the loaded list; no search endpoint exists.
  const visibleDocuments = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return documents
    return documents.filter((document) =>
      [document.title, document.description, document.original_file_name]
        .some((field) => field?.toLowerCase().includes(needle))
    )
  }, [documents, query])

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
    <div className="space-y-4">
      <Input
        type="search"
        aria-label="Search documents"
        placeholder="Search documents"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <ul className="space-y-3">
        {visibleDocuments.length === 0 ? (
          <li className="border-border bg-card rounded-lg border p-5">
            <p className="text-muted-foreground text-sm">No documents match your search.</p>
          </li>
        ) : null}
        {visibleDocuments.map((document) => (
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
            <div className="flex shrink-0 gap-2">
              <Button asChild variant="outline">
                <Link
                  href={`/${churchId}/portal/library/${document.id}`}
                  aria-label={`View ${document.title}`}
                >
                  View
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={downloadingId === document.id}
                aria-label={`Download ${document.title}`}
                onClick={() => handleDownload(document)}
              >
                {downloadingId === document.id ? "Preparing…" : "Download"}
              </Button>
            </div>
          </li>
        ))}
        {downloadError ? (
          <li className="border-destructive/50 bg-card rounded-lg border p-4" role="alert">
            <p className="text-destructive text-sm">{downloadError}</p>
          </li>
        ) : null}
      </ul>
    </div>
  )
}
