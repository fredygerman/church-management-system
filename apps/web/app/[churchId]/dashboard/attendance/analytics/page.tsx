import { getAttendanceTrends } from '@/actions/attendance'

interface PageProps {
  params: Promise<{ churchId: string }>
  searchParams: Promise<{ from?: string; to?: string; groupBy?: 'branch' | 'zone' | 'gender' | 'age_band' }>
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10)
}

function getPastDate(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export default async function AttendanceAnalyticsPage({ params, searchParams }: PageProps) {
  const { churchId } = await params
  const { from = getPastDate(30), to = getTodayDate(), groupBy = 'zone' } = await searchParams

  const rows = await getAttendanceTrends({ churchId, from, to, groupBy }).catch(() => []) as any[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Attendance Analytics</h1>
        <p className="text-sm text-muted-foreground">Trend aggregates for attendance check-ins.</p>
      </div>

      <form className="grid gap-2 rounded-md border p-4 md:grid-cols-4" method="get">
        <input name="from" type="date" defaultValue={from} className="rounded-md border px-3 py-2 text-sm" />
        <input name="to" type="date" defaultValue={to} className="rounded-md border px-3 py-2 text-sm" />
        <select name="groupBy" defaultValue={groupBy} className="rounded-md border px-3 py-2 text-sm">
          <option value="zone">Zone</option>
          <option value="branch">Branch</option>
          <option value="gender">Gender</option>
          <option value="age_band">Age Band</option>
        </select>
        <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Apply</button>
      </form>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">Group</th>
              <th className="px-3 py-2 text-left">Total Check-Ins</th>
              <th className="px-3 py-2 text-left">Unique Members</th>
              <th className="px-3 py-2 text-left">Sessions</th>
              <th className="px-3 py-2 text-left">Avg / Session</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.group} className="border-t">
                <td className="px-3 py-2">{row.group}</td>
                <td className="px-3 py-2">{row.totalCheckins}</td>
                <td className="px-3 py-2">{row.uniqueMembers}</td>
                <td className="px-3 py-2">{row.sessionCount}</td>
                <td className="px-3 py-2">{row.averagePerSession}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-muted-foreground">No data in selected range.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
