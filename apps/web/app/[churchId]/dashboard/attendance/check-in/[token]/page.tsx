import { revalidatePath } from 'next/cache'
import { qrCheckin } from '@/actions/attendance'
import { searchMembers } from '@/actions/member'

interface PageProps {
  params: Promise<{ churchId: string; token: string }>
  searchParams: Promise<{ q?: string }>
}

export default async function QrCheckinTokenPage({ params, searchParams }: PageProps) {
  const { churchId, token } = await params
  const { q = '' } = await searchParams
  const members = q ? await searchMembers(churchId, q).catch(() => []) as any[] : []

  async function submitAction(formData: FormData) {
    'use server'
    const memberId = String(formData.get('memberId') || '')
    if (!memberId) return
    await qrCheckin({ churchId, token, memberId })
    revalidatePath(`/${churchId}/dashboard/attendance/check-in/${token}`)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">QR Check-In</h1>
      <p className="text-sm text-muted-foreground">Token: {token}</p>

      <form className="flex max-w-xl gap-2" method="get">
        <input name="q" defaultValue={q} placeholder="Search member by name or phone" className="flex-1 rounded-md border px-3 py-2 text-sm" />
        <button type="submit" className="rounded-md border px-4 py-2 text-sm">Search</button>
      </form>

      <form action={submitAction} className="max-w-xl space-y-2 rounded-md border p-4">
        <select name="memberId" className="w-full rounded-md border px-2 py-2 text-sm" required>
          <option value="">Select member</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>{member.firstName} {member.lastName}</option>
          ))}
        </select>
        <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Check In</button>
      </form>
    </div>
  )
}
