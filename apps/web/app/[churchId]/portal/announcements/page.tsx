import { getMyAnnouncements } from "@/actions/portal"
import { getLocale, getTranslator } from "@/lib/i18n/server"
import { formatLocaleDate, type Locale } from "@church/config"

interface PageProps {
  params: Promise<{ churchId: string }>
}

function formatDate(value: string | null | undefined, unknownLabel: string, locale: Locale): string {
  if (!value) return unknownLabel
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return unknownLabel
  return formatLocaleDate(date, locale)
}

export default async function PortalAnnouncementsPage({ params }: PageProps) {
  const { churchId } = await params
  const t = await getTranslator()
  const locale = await getLocale()
  const announcements = await getMyAnnouncements(churchId)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t("portal.nav.announcements")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("final.portal.announcements.subtitle")}
        </p>
      </div>

      {announcements.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            {t("final.portal.announcements.empty")}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {announcements.map((announcement: any) => (
            <li key={announcement.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {announcement.subject || announcement.name}
                </p>
                <p className="text-xs text-muted-foreground">{formatDate(announcement.sentAt, t("final.portal.unknownDate"), locale)}</p>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                {announcement.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
