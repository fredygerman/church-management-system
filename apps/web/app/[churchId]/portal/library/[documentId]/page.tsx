import Link from "next/link"

import { getLibraryDocuments } from "@/actions/library"
import { Button } from "@/components/ui/button"
import { getTranslator } from "@/lib/i18n/server"
import { formatBytes, formatFileType } from "../library-format"
import { LibraryReader } from "./library-reader"

interface PageProps {
  params: Promise<{ churchId: string; documentId: string }>
}

function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="text-muted-foreground text-sm underline-offset-4 hover:underline">
      {label}
    </Link>
  )
}

export default async function PortalLibraryDocumentPage({ params }: PageProps) {
  const { churchId, documentId } = await params
  const t = await getTranslator()
  const backHref = `/${churchId}/portal/library`
  const result = await getLibraryDocuments(churchId)

  if (result.status === "unavailable") {
    return (
      <div className="space-y-4">
        <BackLink href={backHref} label={t("portal.library.backToLibrary")} />
        <div className="border-destructive/50 bg-card rounded-lg border p-5">
          <p className="text-destructive text-sm">{result.message}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href={`/${churchId}/portal/library/${documentId}`}>{t("common.retry")}</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Only visible documents appear in the member list, so a miss means not found or not available.
  const item = result.documents.find((doc) => doc.id === documentId)

  if (!item) {
    return (
      <div className="space-y-4">
        <BackLink href={backHref} label={t("portal.library.backToLibrary")} />
        <div className="border-border bg-card rounded-lg border p-5">
          <p className="text-muted-foreground text-sm">
            {t("portal.library.notFound")}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <BackLink href={backHref} label={t("portal.library.backToLibrary")} />

      <div>
        <h1 className="text-foreground text-2xl font-semibold">{item.title}</h1>
        {item.description ? (
          <p className="text-muted-foreground mt-2 whitespace-pre-wrap text-sm">
            {item.description}
          </p>
        ) : null}
        <p className="text-muted-foreground mt-2 text-xs">
          {formatFileType(item, t)} · {formatBytes(item.size_bytes, t)}
        </p>
      </div>

      <LibraryReader
        churchId={churchId}
        documentId={item.id}
        title={item.title}
        contentType={item.content_type}
      />
    </div>
  )
}
