import { Suspense } from "react"
import Link from "next/link"

import { getLibraryDocuments } from "@/actions/library"
import { LibraryDocumentList } from "./library-document-list"
import { Button } from "@/components/ui/button"

interface PageProps {
  params: Promise<{ churchId: string }>
}

function LibraryLoading() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading library">
      {["one", "two", "three"].map((key) => (
        <div key={key} className="border-border bg-card h-28 animate-pulse rounded-lg border" />
      ))}
    </div>
  )
}

async function LibraryContent({ churchId }: { churchId: string }) {
  const result = await getLibraryDocuments(churchId)

  if (result.status === "unavailable") {
    return (
      <div className="border-destructive/50 bg-card rounded-lg border p-5">
        <p className="text-destructive text-sm">{result.message}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={`/${churchId}/portal/library`}>Retry</Link>
        </Button>
      </div>
    )
  }

  if (result.documents.length === 0) {
    return (
      <div className="border-border bg-card rounded-lg border p-5">
        <p className="text-muted-foreground text-sm">
          No shared documents have been published yet
        </p>
      </div>
    )
  }

  return <LibraryDocumentList churchId={churchId} documents={result.documents} />
}

export default async function PortalLibraryPage({ params }: PageProps) {
  const { churchId } = await params

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-foreground text-2xl font-semibold">Library</h1>
        <p className="text-muted-foreground text-sm">
          Download documents shared with members of your church.
        </p>
      </div>

      <Suspense fallback={<LibraryLoading />}>
        <LibraryContent churchId={churchId} />
      </Suspense>

      {/* TODO: Add reviewed Swahili copy alongside the English member experience. */}
    </div>
  )
}
