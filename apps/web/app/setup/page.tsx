import { getSession } from '@/auth'
import { redirect } from 'next/navigation'
import { SetupChurch } from '@/components/church/setup-church'

export default async function SetupPage() {
  const session = await getSession()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <SetupChurch />
    </div>
  )
}
