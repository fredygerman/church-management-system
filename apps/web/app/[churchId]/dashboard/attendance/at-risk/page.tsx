import { getAtRiskMembers } from '@/actions/attendance'
import { UnavailableState } from '@/components/ui/unavailable-state'
import { getTranslator } from '@/lib/i18n/server'
import { loadOrUnavailable } from '@/lib/load-or-unavailable'

interface PageProps {
  params: Promise<{ churchId: string }>
}

export default async function AtRiskMembersPage({ params }: PageProps) {
  const t = await getTranslator()
  const { churchId } = await params
  const rowsResult = await loadOrUnavailable(() => getAtRiskMembers(churchId))
  // A failed request is shown as unavailable, not as "no at-risk members".
  const rows = rowsResult.status === 'ok' ? (rowsResult.data as any[]) : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t('staff.attendance.atRisk.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('staff.attendance.atRisk.description')}</p>
      </div>

      {rows ? <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">{t('staff.attendance.atRisk.member')}</th>
              <th className="px-3 py-2 text-left">{t('staff.attendance.atRisk.phone')}</th>
              <th className="px-3 py-2 text-left">{t('staff.attendance.atRisk.missed')}</th>
              <th className="px-3 py-2 text-left">{t('staff.attendance.atRisk.threshold')}</th>
              <th className="px-3 py-2 text-left">{t('staff.attendance.atRisk.lastSession')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.flagId} className="border-t">
                <td className="px-3 py-2">{row.firstName} {row.lastName}</td>
                <td className="px-3 py-2">{row.phone || '-'}</td>
                <td className="px-3 py-2">{row.consecutiveMissedCount}</td>
                <td className="px-3 py-2">{row.thresholdUsed}</td>
                <td className="px-3 py-2">{row.lastSessionDate || '-'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-muted-foreground">{t('staff.attendance.atRisk.empty')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div> : <UnavailableState title={t('staff.common.unavailableTitle')} message={t('staff.common.unavailableMessage')} />}
    </div>
  )
}
