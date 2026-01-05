'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface DashboardStats {
  totalMembers: number
  activeZones: number
  pendingVisitors: number
  recentActivities: any[]
}

export default function DashboardHome() {
  const params = useParams()
  const churchId = params.churchId as string
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    activeZones: 0,
    pendingVisitors: 0,
    recentActivities: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // TODO: Fetch stats from API
    setIsLoading(false)
  }, [churchId])

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Members Card */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Members
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

        {/* Active Zones Card */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Active Zones
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

        {/* Pending Visitors Card */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Pending Visitors
              </p>
              <p className="text-2xl font-bold">{stats.pendingVisitors}</p>
            </div>
            <div className="rounded-full bg-orange-100 p-3">
              <svg
                className="h-6 w-6 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <div className="mt-4">
          {stats.recentActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activities</p>
          ) : (
            <ul className="space-y-2">
              {stats.recentActivities.map((activity, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  {activity.description}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
