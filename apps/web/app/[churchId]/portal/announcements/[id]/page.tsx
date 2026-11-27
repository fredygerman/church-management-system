import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { loadAnnouncement } from "@/components/announcements/announcement-api"
import { AnnouncementFileLink } from "@/components/announcements/announcement-file-link"
import { formatAnnouncementDate } from "@/components/announcements/format-date"
import { DocView } from "@/components/announcements/doc-view"
import { collectFiles, docToViewModel } from "@/lib/announcements/doc-view-model"
import { getLocale, getTranslator } from "@/lib/i18n/server"

interface PageProps {
  params: Promise<{ churchId: string; id: string }>
}

export default async function PortalAnnouncementDetailPage({ params }: PageProps) {
  const { churchId, id } = await params
  const t = await getTranslator()
  const locale = await getLocale()

  const back = (
    <Link
      href={`/${churchId}/portal/announcements`}
      className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      {t("member.content.announcements.back")}
    </Link>
  )

  const result = await loadAnnouncement(churchId, id)

  if (result.status !== "ok") {
    const notFound = result.status === "not_found"
    return (
      <div className="space-y-4">
        {back}
        <div className="rounded-lg border border-border bg-card p-5">
          <h1 className="text-lg font-semibold text-foreground">
            {notFound
              ? t("member.content.announcements.notFound.title")
              : t("member.content.announcements.detailError")}
          </h1>
          {notFound ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {t("member.content.announcements.notFound.body")}
            </p>
          ) : null}
        </div>
      </div>
    )
  }

  const announcement = result.value
  const blocks = docToViewModel(announcement.body)
  const files = collectFiles(blocks)

  return (
    <article className="space-y-6">
      {back}

      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">{announcement.title}</h1>
        <p className="text-xs text-muted-foreground">
          {formatAnnouncementDate(
            announcement.publishedAt ?? announcement.createdAt,
            t("final.portal.unknownDate"),
            locale
          )}
        </p>
        {announcement.summary ? (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{announcement.summary}</p>
        ) : null}
      </header>

      <section className="rounded-lg border border-border bg-card p-5">
        {blocks.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("member.content.announcements.emptyBody")}</p>
        ) : (
          <DocView blocks={blocks} churchId={churchId} />
        )}
      </section>

      {files.length > 0 ? (
        <section aria-labelledby="announcement-files" className="space-y-3">
          <h2 id="announcement-files" className="text-base font-semibold text-foreground">
            {t("member.content.announcements.files.heading")}
          </h2>
          <ul className="space-y-2">
            {files.map((file) => (
              <li key={file.attachmentId}>
                <AnnouncementFileLink churchId={churchId} attachmentId={file.attachmentId} name={file.name} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  )
}
