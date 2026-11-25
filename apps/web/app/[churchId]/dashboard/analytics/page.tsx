import Link from "next/link"
import { getSession } from "@/auth"
import { hasPermission } from "@/lib/permissions"
import { REPORTS } from "@/lib/report-catalog"
import { getTranslator } from "@/lib/i18n/server"

interface PageProps {
  params: Promise<{ churchId: string }>
}

export default async function ReportsPage({ params }: PageProps) {
  const t = await getTranslator()
  const { churchId } = await params
  const session = await getSession()
  const role = session?.user?.activeRole || session?.user?.role
  // Only reports the caller's role may open are listed; each page still checks on its own.
  const available = REPORTS.filter((report) => report.permissions.every((permission) => hasPermission(role, permission)))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t('staff.analytics.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('staff.analytics.description')}
        </p>
      </div>

      {available.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('staff.analytics.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {available.map((report) => (
            <li key={report.href} className="rounded-md border p-4">
              <Link href={`/${churchId}${report.href}`} className="font-medium underline-offset-4 hover:underline">
                {t(report.titleKey)}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">{t(report.definitionKey)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
