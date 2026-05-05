import { getAtRiskMembers } from '@/actions/attendance'

interface PageProps {
  params: Promise<{ churchId: string }>
}

export default async function AtRiskMembersPage({ params }: PageProps) {
  const { churchId } = await params
  const rows = await getAtRiskMembers(churchId).catch(() => []) as any[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">At-Risk Members Queue</h1>
        <p className="text-sm text-muted-foreground">Members currently meeting consecutive missed-service threshold.</p>
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">Member</th>
              <th className="px-3 py-2 text-left">Phone</th>
              <th className="px-3 py-2 text-left">Missed</th>
              <th className="px-3 py-2 text-left">Threshold</th>
              <th className="px-3 py-2 text-left">Last Session Date</th>
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
                <td colSpan={5} className="px-3 py-4 text-muted-foreground">No at-risk members right now.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
