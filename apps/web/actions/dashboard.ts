'use server'

import { getSession } from '@/auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

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
  const session = await getSession()
  if (!session?.accessToken) {
    throw new Error('Unauthorized')
  }

  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats?churchId=${churchId}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard stats')
    }

    return response.json()
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
