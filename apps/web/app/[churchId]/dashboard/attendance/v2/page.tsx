import { getAttendanceCohorts, getAttendanceTrendComparison, getOpenSessionHealth } from '@/actions/attendance'
import { UnavailableState } from '@/components/ui/unavailable-state'
import { getTranslator } from '@/lib/i18n/server'
import { loadOrUnavailable } from '@/lib/load-or-unavailable'

// "Branch" is not offered: the API groups it by zone, so it would be mislabelled.
const GROUPS = ['zone', 'gender', 'age_band'] as const
type Group = (typeof GROUPS)[number]

interface PageProps { params: Promise<{ churchId: string }>; searchParams: Promise<{ from?: string; to?: string; groupBy?: string }> }

function today() { return new Date().toISOString().slice(0, 10) }
function past(days: number) { const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString().slice(0, 10) }

export default async function AttendanceV2Page({ params, searchParams }: PageProps) {
  const t = await getTranslator()
  const { churchId } = await params
  const { from = past(30), to = today(), groupBy: requested } = await searchParams
  const groupBy: Group = (GROUPS as readonly string[]).includes(requested ?? '') ? (requested as Group) : 'zone'

  const [comparison, cohortsResult, openHealth] = await Promise.all([
    getAttendanceTrendComparison({ churchId, from, to, groupBy }).catch(() => []),
    loadOrUnavailable(() => getAttendanceCohorts({ churchId, from, to })),
    getOpenSessionHealth(churchId).catch(() => []),
  ]) as any
  // A failed cohorts request is shown as unavailable, never as zero sessions or members.
  const cohorts = cohortsResult.status === 'ok' ? cohortsResult.data : null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t('staff.attendance.v2.title')}</h1>
      <form method="get" className="grid gap-2 rounded-md border p-4 md:grid-cols-4">
        <input name="from" type="date" defaultValue={from} className="rounded-md border px-3 py-2 text-sm" />
        <input name="to" type="date" defaultValue={to} className="rounded-md border px-3 py-2 text-sm" />
        <select name="groupBy" defaultValue={groupBy} className="rounded-md border px-3 py-2 text-sm"><option value="zone">{t('staff.attendance.v2.groupBy.zone')}</option><option value="gender">{t('staff.attendance.v2.groupBy.gender')}</option><option value="age_band">{t('staff.attendance.v2.groupBy.ageBand')}</option></select>
        <button className="rounded-md border px-3 py-2 text-sm" type="submit">{t('staff.attendance.analytics.apply')}</button>
      </form>
      {cohorts ? (
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">{t('staff.attendance.v2.totalSessions')}</p><p className="text-xl font-semibold">{cohorts.totalSessions}</p></div>
          <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">{t('staff.attendance.v2.totalMembers')}</p><p className="text-xl font-semibold">{cohorts.totalMembers}</p></div>
          <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">{t('staff.attendance.v2.regular')}</p><p className="text-xl font-semibold">{cohorts.regularMembers}</p></div>
          <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">{t('staff.attendance.v2.irregular')}</p><p className="text-xl font-semibold">{cohorts.irregularMembers}</p></div>
        </div>
      ) : (
        <UnavailableState title={t('staff.common.unavailableTitle')} message={t('staff.common.unavailableMessage')} />
      )}
      <div className="rounded-md border"><table className="w-full text-sm"><thead className="bg-muted/40"><tr><th className="px-3 py-2 text-left">{t('staff.attendance.analytics.group')}</th><th className="px-3 py-2 text-left">{t('staff.attendance.v2.current')}</th><th className="px-3 py-2 text-left">{t('staff.attendance.v2.previous')}</th><th className="px-3 py-2 text-left">{t('staff.attendance.v2.delta')}</th></tr></thead><tbody>{comparison.map((r:any)=><tr key={r.group} className="border-t"><td className="px-3 py-2">{r.group}</td><td className="px-3 py-2">{r.totalCheckins}</td><td className="px-3 py-2">{r.previousTotalCheckins}</td><td className="px-3 py-2">{r.deltaCheckins}</td></tr>)}{!comparison.length && <tr><td colSpan={4} className="px-3 py-4 text-muted-foreground">{t('staff.attendance.v2.noComparison')}</td></tr>}</tbody></table></div>
      <div className="rounded-md border"><table className="w-full text-sm"><thead className="bg-muted/40"><tr><th className="px-3 py-2 text-left">{t('staff.attendance.v2.openSession')}</th><th className="px-3 py-2 text-left">{t('staff.attendance.v2.checkIns')}</th><th className="px-3 py-2 text-left">{t('staff.attendance.v2.headcount')}</th><th className="px-3 py-2 text-left">{t('staff.attendance.v2.gap')}</th></tr></thead><tbody>{openHealth.map((h:any)=><tr key={h.sessionId} className="border-t"><td className="px-3 py-2">{h.title || h.sessionDate}</td><td className="px-3 py-2">{h.totalCheckins}</td><td className="px-3 py-2">{h.totalHeadcount}</td><td className="px-3 py-2">{h.headcountGap}</td></tr>)}{!openHealth.length && <tr><td colSpan={4} className="px-3 py-4 text-muted-foreground">{t('staff.attendance.noOpenSessions')}</td></tr>}</tbody></table></div>
    </div>
  )
}
