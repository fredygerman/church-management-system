import { getAttendanceTrends } from '@/actions/attendance'
import { ATTENDANCE_MEASURES } from '@/lib/report-catalog'

// The API groups by department too, but the page offers only these. "Branch" is not offered:
// the API groups it by zone, so it would be mislabelled.
const GROUPS = ['zone', 'gender', 'age_band'] as const
type Group = (typeof GROUPS)[number]

interface TrendRow {
  group: string
  totalCheckins: number
  uniqueMembers: number
  sessionCount: number
  averagePerSession: number
}

interface PageProps {
  params: Promise<{ churchId: string }>
  searchParams: Promise<{ from?: string; to?: string; groupBy?: string }>
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10)
}

function getPastDate(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function isRedirect(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest
  return typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')
}

export default async function AttendanceAnalyticsPage({ params, searchParams }: PageProps) {
  const { churchId } = await params
  const query = await searchParams
  const from = query.from || getPastDate(30)
  const to = query.to || getTodayDate()
  const groupBy: Group = (GROUPS as readonly string[]).includes(query.groupBy ?? '') ? (query.groupBy as Group) : 'zone'

  // A failed request is shown as unavailable, never as zero check-ins.
  let rows: TrendRow[] = []
  let unavailable = false
  try {
    const result: unknown = await getAttendanceTrends({ churchId, from, to, groupBy })
    if (Array.isArray(result)) {
      rows = result as TrendRow[]
    } else {
      unavailable = true
    }
  } catch (error) {
    if (isRedirect(error)) throw error
    unavailable = true
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Attendance Trends</h1>
        <p className="text-sm text-muted-foreground">Check-ins grouped by zone, gender or age band.</p>
      </div>

      <form className="grid gap-2 rounded-md border p-4 md:grid-cols-4" method="get">
        <input name="from" type="date" defaultValue={from} className="rounded-md border px-3 py-2 text-sm" />
        <input name="to" type="date" defaultValue={to} className="rounded-md border px-3 py-2 text-sm" />
        <select name="groupBy" defaultValue={groupBy} className="rounded-md border px-3 py-2 text-sm">
          <option value="zone">Zone</option>
          <option value="gender">Gender</option>
          <option value="age_band">Age Band</option>
        </select>
        <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Apply</button>
      </form>

      {unavailable ? (
        <p role="alert" className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Attendance trends are unavailable right now. Try again in a moment.
        </p>
      ) : (
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
                  <td colSpan={5} className="px-3 py-4 text-muted-foreground">No check-ins in the selected range.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <dl className="grid gap-2 text-sm md:grid-cols-2">
        {ATTENDANCE_MEASURES.map((measure) => (
          <div key={measure.label}>
            <dt className="font-medium">{measure.label}</dt>
            <dd className="text-muted-foreground">{measure.definition}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
