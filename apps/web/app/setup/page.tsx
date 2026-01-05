import { getSession } from '@/auth'
import { redirect } from 'next/navigation'
import { SetupChurch } from '@/components/church/setup-church'
import { apiRequest } from '@/lib/api-client'

export default async function SetupPage() {
  const session = await getSession()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Check if user already has a churchId by fetching their profile
  const profileResponse = await apiRequest({
    requestConfig: {
      method: 'GET',
      url: '/auth/profile',
    },
  })

  // If user already has a church assigned, redirect to home
  if (profileResponse.success && profileResponse.data?.churchId) {
    redirect('/')
  }

  // Also verify that no churches exist in the database yet
  const churchesResponse = await apiRequest({
    requestConfig: {
      method: 'GET',
      url: '/churches',
    },
  })

  // If churches already exist, redirect to home (setup already completed by another user)
  if (churchesResponse.success && churchesResponse.data && Array.isArray(churchesResponse.data) && churchesResponse.data.length > 0) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-slate-100">
      <SetupChurch />
    </div>
  )
}
