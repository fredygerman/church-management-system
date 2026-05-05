import { getAttendanceCohorts, getAttendanceTrendComparison, getOpenSessionHealth } from '@/actions/attendance'

interface PageProps { params: Promise<{ churchId: string }>; searchParams: Promise<{ from?: string; to?: string; groupBy?: 'branch' | 'zone' | 'gender' | 'age_band' }> }

function today() { return new Date().toISOString().slice(0, 10) }
function past(days: number) { const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString().slice(0, 10) }

export default async function AttendanceV2Page({ params, searchParams }: PageProps) {
  const { churchId } = await params
  const { from = past(30), to = today(), groupBy = 'zone' } = await searchParams

  const [comparison, cohorts, openHealth] = await Promise.all([
    getAttendanceTrendComparison({ churchId, from, to, groupBy }).catch(() => []),
    getAttendanceCohorts({ churchId, from, to }).catch(() => ({ totalSessions: 0, totalMembers: 0, regularMembers: 0, irregularMembers: 0 })),
    getOpenSessionHealth(churchId).catch(() => []),
  ]) as any

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Attendance Intelligence V2</h1>
      <form method="get" className="grid gap-2 rounded-md border p-4 md:grid-cols-4">
        <input name="from" type="date" defaultValue={from} className="rounded-md border px-3 py-2 text-sm" />
        <input name="to" type="date" defaultValue={to} className="rounded-md border px-3 py-2 text-sm" />
        <select name="groupBy" defaultValue={groupBy} className="rounded-md border px-3 py-2 text-sm"><option value="zone">zone</option><option value="branch">branch</option><option value="gender">gender</option><option value="age_band">age_band</option></select>
        <button className="rounded-md border px-3 py-2 text-sm" type="submit">Apply</button>
      </form>
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Total Sessions</p><p className="text-xl font-semibold">{cohorts.totalSessions}</p></div>
        <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Total Members</p><p className="text-xl font-semibold">{cohorts.totalMembers}</p></div>
        <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Regular</p><p className="text-xl font-semibold">{cohorts.regularMembers}</p></div>
        <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Irregular</p><p className="text-xl font-semibold">{cohorts.irregularMembers}</p></div>
      </div>
      <div className="rounded-md border"><table className="w-full text-sm"><thead className="bg-muted/40"><tr><th className="px-3 py-2 text-left">Group</th><th className="px-3 py-2 text-left">Current</th><th className="px-3 py-2 text-left">Previous</th><th className="px-3 py-2 text-left">Delta</th></tr></thead><tbody>{comparison.map((r:any)=><tr key={r.group} className="border-t"><td className="px-3 py-2">{r.group}</td><td className="px-3 py-2">{r.totalCheckins}</td><td className="px-3 py-2">{r.previousTotalCheckins}</td><td className="px-3 py-2">{r.deltaCheckins}</td></tr>)}{!comparison.length && <tr><td colSpan={4} className="px-3 py-4 text-muted-foreground">No comparison data.</td></tr>}</tbody></table></div>
      <div className="rounded-md border"><table className="w-full text-sm"><thead className="bg-muted/40"><tr><th className="px-3 py-2 text-left">Open Session</th><th className="px-3 py-2 text-left">Check-ins</th><th className="px-3 py-2 text-left">Headcount</th><th className="px-3 py-2 text-left">Gap</th></tr></thead><tbody>{openHealth.map((h:any)=><tr key={h.sessionId} className="border-t"><td className="px-3 py-2">{h.title || h.sessionDate}</td><td className="px-3 py-2">{h.totalCheckins}</td><td className="px-3 py-2">{h.totalHeadcount}</td><td className="px-3 py-2">{h.headcountGap}</td></tr>)}{!openHealth.length && <tr><td colSpan={4} className="px-3 py-4 text-muted-foreground">No open sessions.</td></tr>}</tbody></table></div>
    </div>
  )
}
