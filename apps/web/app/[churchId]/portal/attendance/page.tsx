import { getMyAttendance } from "@/actions/portal"
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

export default async function PortalAttendancePage({ params }: PageProps) {
  const { churchId } = await params
  const t = await getTranslator()
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
              <p className="text-sm text-muted-foreground">{formatDate(checkin.sessionDate, t("final.portal.unknownDate"))}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
