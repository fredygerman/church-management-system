import { Suspense } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { UnavailableState } from "@/components/ui/unavailable-state"
import { getTranslator } from "@/lib/i18n/server"
import { ensurePermission } from "@/lib/permissions-server"
import { getStaffDocuments } from "./staff-documents"
import { StaffDocumentDeleteButton } from "./staff-document-delete-button"
import { StaffDocumentUploadForm } from "./staff-document-upload-form"
import { StaffDocumentVisibilityToggle } from "./staff-document-visibility-toggle"

interface PageProps {
  params: Promise<{ churchId: string }>
}

function ContentLoading({ label }: { label: string }) {
  return (
    <div
      className="bg-muted/30 h-48 animate-pulse rounded-md border"
      aria-busy="true"
      aria-label={label}
    />
  )
}

function formatSize(sizeBytes: number): string {
  return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`
}

async function ContentDocuments({ churchId }: { churchId: string }) {
  const t = await getTranslator()
  const result = await getStaffDocuments(churchId)

  if (result.status === "unavailable") {
    return <UnavailableState title={t("staff.content.unavailableTitle")} message={result.message} />
  }

  if (result.status === "error") {
    return (
      <div className="border-destructive/50 rounded-md border p-5" role="alert">
        <p className="text-destructive text-sm">{result.message}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={`/${churchId}/dashboard/content`}>{t("staff.common.retry")}</Link>
        </Button>
      </div>
    )
  }

  if (result.documents.length === 0) {
    return (
      <div className="rounded-md border p-5">
        <p className="text-muted-foreground text-sm">{t("staff.content.empty")}</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr>
            <th className="px-3 py-2 text-left">{t("staff.content.fieldTitle")}</th>
            <th className="px-3 py-2 text-left">{t("staff.content.fieldFile")}</th>
            <th className="px-3 py-2 text-left">{t("staff.content.size")}</th>
            <th className="px-3 py-2 text-left">{t("staff.content.visible")}</th>
            <th className="px-3 py-2 text-left">{t("staff.content.added")}</th>
            <th className="px-3 py-2 text-left">
              <span className="sr-only">{t("staff.content.actions")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {result.documents.map((document) => (
            <tr key={document.id} className="border-t">
              <td className="px-3 py-2">{document.title}</td>
              <td className="px-3 py-2">{document.originalFileName}</td>
              <td className="px-3 py-2">{formatSize(document.sizeBytes)}</td>
              <td className="px-3 py-2">
                <StaffDocumentVisibilityToggle
                  churchId={churchId}
                  documentId={document.id}
                  visibleToMembers={document.visibleToMembers}
                />
              </td>
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
  const t = await getTranslator()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("staff.content.title")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("staff.content.description")}
        </p>
      </div>
      <StaffDocumentUploadForm churchId={churchId} />
      <Suspense fallback={<ContentLoading label={t("staff.content.loading")} />}>
        <ContentDocuments churchId={churchId} />
      </Suspense>
    </div>
  )
}
