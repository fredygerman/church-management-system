import Link from 'next/link'
import { getTranslator } from '@/lib/i18n/server'

interface PageProps {
  params: Promise<{ churchId: string }>
}

const cards = [
  { titleKey: 'final.attendanceHub.serviceTypes.title', descKey: 'final.attendanceHub.serviceTypes.desc', href: '/dashboard/attendance/service-types' },
  { titleKey: 'final.attendanceHub.sessions.title', descKey: 'final.attendanceHub.sessions.desc', href: '/dashboard/attendance/sessions' },
  { titleKey: 'final.attendanceHub.checkIn.title', descKey: 'final.attendanceHub.checkIn.desc', href: '/dashboard/attendance/check-in' },
  { titleKey: 'final.attendanceHub.analytics.title', descKey: 'final.attendanceHub.analytics.desc', href: '/dashboard/attendance/analytics' },
  { titleKey: 'final.attendanceHub.atRisk.title', descKey: 'final.attendanceHub.atRisk.desc', href: '/dashboard/attendance/at-risk' },
  { titleKey: 'final.attendanceHub.riskSettings.title', descKey: 'final.attendanceHub.riskSettings.desc', href: '/dashboard/attendance/risk-settings' },
] as const

export default async function AttendancePage({ params }: PageProps) {
  const { churchId } = await params
  const t = await getTranslator()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t('final.attendanceHub.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('final.attendanceHub.subtitle')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <Link key={card.titleKey} href={`/${churchId}${card.href}`} className="rounded-lg border p-4 hover:bg-muted/40">
            <h2 className="font-medium">{t(card.titleKey)}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t(card.descKey)}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
