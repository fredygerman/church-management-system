'use server'

import { apiGet } from '@/lib/api-helpers'

export interface DashboardStats {
  totalMembers: number
  activeZones: number
}

export type DashboardStatsResult =
  | { status: 'ok'; data: DashboardStats }
  | { status: 'unavailable' }

// Function to get dashboard statistics for a church
export async function getDashboardStats(
  churchId: string,
): Promise<DashboardStatsResult> {
  try {
    return { status: 'ok', data: await apiGet('/dashboard/stats', { churchId }) }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return { status: 'unavailable' }
  }
}
