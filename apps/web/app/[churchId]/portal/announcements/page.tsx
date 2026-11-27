import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { loadAnnouncements } from "@/components/announcements/announcement-api"
import { formatAnnouncementDate } from "@/components/announcements/format-date"
import { getLocale, getTranslator } from "@/lib/i18n/server"

interface PageProps {
  params: Promise<{ churchId: string }>
}

export default async function PortalAnnouncementsPage({ params }: PageProps) {
  const { churchId } = await params
  const t = await getTranslator()
  const locale = await getLocale()
  const result = await loadAnnouncements(churchId)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t("portal.nav.announcements")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("final.portal.announcements.subtitle")}
        </p>
      </div>

      {result.status !== "ok" ? (
        <div className="rounded-lg border border-border bg-card p-5">
          <p role="alert" className="text-sm text-muted-foreground">
            {t("member.content.announcements.loadError")}
          </p>
        </div>
      ) : result.value.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            {t("final.portal.announcements.empty")}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {result.value.map((announcement) => (
            <li key={announcement.id}>
              <Link
                href={`/${churchId}/portal/announcements/${encodeURIComponent(announcement.id)}`}
                className="hover:bg-muted/40 focus-visible:ring-ring block rounded-lg border border-border bg-card p-5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-medium text-foreground">{announcement.title}</p>
                  <p className="shrink-0 text-xs text-muted-foreground">
                    {formatAnnouncementDate(
                      announcement.publishedAt ?? announcement.createdAt,
                      t("final.portal.unknownDate"),
                      locale
                    )}
                  </p>
                </div>
                {announcement.summary ? (
                  <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
                    {announcement.summary}
                  </p>
                ) : null}
                <span className="text-primary mt-3 inline-flex items-center gap-1 text-xs font-medium">
                  {t("member.content.announcements.read")}
                  <ChevronRight className="size-3.5" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
