'use server'

import { apiGet } from '@/lib/api-helpers'

export interface DashboardStats {
  totalMembers: number
  activeZones: number
  pendingVisitors: number
  recentActivities: Array<{
    id: string
    description: string
    timestamp: string
    type: string
  }>
}

// Function to get dashboard statistics for a church
export async function getDashboardStats(churchId: string): Promise<DashboardStats> {
  try {
    return await apiGet('/dashboard/stats', { churchId })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    // Return default stats if API fails
    return {
      totalMembers: 0,
      activeZones: 0,
      pendingVisitors: 0,
      recentActivities: [],
    }
  }
}
