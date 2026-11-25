import { getMyAnnouncements } from "@/actions/portal"
import { getTranslator } from "@/lib/i18n/server"

interface PageProps {
  params: Promise<{ churchId: string }>
}

function formatDate(value: string | null | undefined, unknownLabel: string): string {
  if (!value) return unknownLabel
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return unknownLabel
  return date.toLocaleDateString()
}

export default async function PortalAnnouncementsPage({ params }: PageProps) {
  const { churchId } = await params
  const t = await getTranslator()
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
                <p className="text-xs text-muted-foreground">{formatDate(announcement.sentAt, t("final.portal.unknownDate"))}</p>
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
