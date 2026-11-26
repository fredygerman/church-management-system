import { getMyAttendance } from "@/actions/portal"
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

export default async function PortalAttendancePage({ params }: PageProps) {
  const { churchId } = await params
  const t = await getTranslator()
  const locale = await getLocale()
  const checkins = await getMyAttendance(churchId)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t("portal.nav.attendance")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("final.portal.attendance.subtitle")}
        </p>
      </div>

      {checkins.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            {t("final.portal.attendance.empty")}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {checkins.map((checkin: any) => (
            <li
              key={checkin.checkinId}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {checkin.sessionTitle || checkin.serviceTypeName}
                </p>
                <p className="text-xs text-muted-foreground">{checkin.serviceTypeName}</p>
              </div>
              <p className="text-sm text-muted-foreground">{formatDate(checkin.sessionDate, t("final.portal.unknownDate"), locale)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
