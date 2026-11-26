import { getDashboardStats } from '@/actions/dashboard'
import { UnavailableState } from '@/components/ui/unavailable-state'
import { getTranslator } from '@/lib/i18n/server'

interface DashboardHomeProps {
  params: Promise<{
    churchId: string
  }>
}

export default async function DashboardHome({ params }: DashboardHomeProps) {
  const t = await getTranslator()
  const { churchId } = await params
  const statsResult = await getDashboardStats(churchId)

  if (statsResult.status === 'unavailable') {
    return (
      <UnavailableState
        title={t('staff.home.unavailableTitle')}
        message={t('staff.home.unavailableMessage')}
      />
    )
  }

  const stats = statsResult.data

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Total Members Card */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('staff.home.totalMembers')}
              </p>
              <p className="text-2xl font-bold">{stats.totalMembers}</p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Pending Visitors Card: only roles that can view visitors receive the count */}
        {stats.pendingVisitors !== undefined && (
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm font-medium text-muted-foreground">
              {t('staff.home.pendingVisitors')}
            </p>
            <p className="text-2xl font-bold">{stats.pendingVisitors}</p>
          </div>
        )}

        {/* Active Zones Card */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('staff.home.activeZones')}
              </p>
              <p className="text-2xl font-bold">{stats.activeZones}</p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
