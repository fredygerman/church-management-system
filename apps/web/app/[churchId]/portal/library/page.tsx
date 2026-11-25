import { Suspense } from "react"
import Link from "next/link"

import { getLibraryDocuments } from "@/actions/library"
import { getTranslator } from "@/lib/i18n/server"
import { LibraryDocumentList } from "./library-document-list"
import { Button } from "@/components/ui/button"

interface PageProps {
  params: Promise<{ churchId: string }>
}

function LibraryLoading({ label }: { label: string }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label={label}>
      {["one", "two", "three"].map((key) => (
        <div key={key} className="border-border bg-card h-28 animate-pulse rounded-lg border" />
      ))}
    </div>
  )
}

async function LibraryContent({ churchId }: { churchId: string }) {
  const t = await getTranslator()
  const result = await getLibraryDocuments(churchId)

  if (result.status === "unavailable") {
    return (
      <div className="border-destructive/50 bg-card rounded-lg border p-5">
        <p className="text-destructive text-sm">{result.message}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={`/${churchId}/portal/library`}>{t("common.retry")}</Link>
        </Button>
      </div>
    )
  }

  if (result.documents.length === 0) {
    return (
      <div className="border-border bg-card rounded-lg border p-5">
        <p className="text-muted-foreground text-sm">
          {t("portal.library.empty")}
        </p>
      </div>
    )
  }

  return <LibraryDocumentList churchId={churchId} documents={result.documents} />
}

export default async function PortalLibraryPage({ params }: PageProps) {
  const { churchId } = await params
  const t = await getTranslator()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-foreground text-2xl font-semibold">{t("portal.library.title")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("portal.library.subtitle")}
        </p>
      </div>

      <Suspense fallback={<LibraryLoading label={t("portal.library.loadingLabel")} />}>
        <LibraryContent churchId={churchId} />
      </Suspense>
    </div>
  )
}
