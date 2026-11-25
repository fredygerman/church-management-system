import { Suspense } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { UnavailableState } from "@/components/ui/unavailable-state"
import { ensurePermission } from "@/lib/permissions-server"
import { getStaffDocuments } from "./staff-documents"
import { StaffDocumentDeleteButton } from "./staff-document-delete-button"
import { StaffDocumentUploadForm } from "./staff-document-upload-form"

interface PageProps {
  params: Promise<{ churchId: string }>
}

function ContentLoading() {
  return (
    <div
      className="bg-muted/30 h-48 animate-pulse rounded-md border"
      aria-busy="true"
      aria-label="Loading content"
    />
  )
}

function formatSize(sizeBytes: number): string {
  return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`
}

async function ContentDocuments({ churchId }: { churchId: string }) {
  const result = await getStaffDocuments(churchId)

  if (result.status === "unavailable") {
    return <UnavailableState title="Content unavailable" message={result.message} />
  }

  if (result.status === "error") {
    return (
      <div className="border-destructive/50 rounded-md border p-5" role="alert">
        <p className="text-destructive text-sm">{result.message}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={`/${churchId}/dashboard/content`}>Retry</Link>
        </Button>
      </div>
    )
  }

  if (result.documents.length === 0) {
    return (
      <div className="rounded-md border p-5">
        <p className="text-muted-foreground text-sm">No documents have been added yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr>
            <th className="px-3 py-2 text-left">Title</th>
            <th className="px-3 py-2 text-left">File</th>
            <th className="px-3 py-2 text-left">Size</th>
            <th className="px-3 py-2 text-left">Visible to members</th>
            <th className="px-3 py-2 text-left">Added</th>
            <th className="px-3 py-2 text-left">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {result.documents.map((document) => (
            <tr key={document.id} className="border-t">
              <td className="px-3 py-2">{document.title}</td>
              <td className="px-3 py-2">{document.originalFileName}</td>
              <td className="px-3 py-2">{formatSize(document.sizeBytes)}</td>
              <td className="px-3 py-2">{document.visibleToMembers ? "Yes" : "No"}</td>
              <td className="px-3 py-2">{document.createdAt.slice(0, 10)}</td>
              <td className="px-3 py-2 text-right">
                <StaffDocumentDeleteButton
                  churchId={churchId}
                  documentId={document.id}
                  title={document.title}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default async function ContentPage({ params }: PageProps) {
  // Denied state: users without manage:files are sent to /forbidden, as on other staff pages.
  await ensurePermission("manage:files")
  const { churchId } = await params

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Content</h1>
        <p className="text-muted-foreground text-sm">
          Documents shared through the library.
        </p>
      </div>
      <StaffDocumentUploadForm churchId={churchId} />
      <Suspense fallback={<ContentLoading />}>
        <ContentDocuments churchId={churchId} />
      </Suspense>
      {/* TODO: Add reviewed Swahili copy for this staff page. */}
    </div>
  )
}
