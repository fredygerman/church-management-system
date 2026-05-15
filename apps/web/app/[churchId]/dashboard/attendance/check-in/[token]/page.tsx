import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { qrCheckin } from '@/actions/attendance'
import { searchMembers } from '@/actions/member'
import { checkPermission, ensurePermission } from '@/lib/permissions-server'

interface PageProps {
  params: Promise<{ churchId: string; token: string }>
  searchParams: Promise<{ q?: string; ok?: string; err?: string }>
}

export default async function QrCheckinTokenPage({ params, searchParams }: PageProps) {
  await ensurePermission('view:attendance')
  const { churchId, token } = await params
  const { q = '', ok = '', err = '' } = await searchParams
  const canManageAttendance = await checkPermission('manage:attendance')
  const members = q ? await searchMembers(churchId, q).catch(() => []) as any[] : []

  async function submitAction(formData: FormData) {
    'use server'
    const memberId = String(formData.get('memberId') || '')
    const qParam = String(formData.get('q') || '')
    if (!memberId) {
      redirect(`/${churchId}/dashboard/attendance/check-in/${token}?q=${encodeURIComponent(qParam)}&err=${encodeURIComponent('Select a member.')}`)
    }
    if (!(await checkPermission('manage:attendance'))) {
      redirect(`/${churchId}/dashboard/attendance/check-in/${token}?q=${encodeURIComponent(qParam)}&err=${encodeURIComponent('You are not allowed to check in members.')}`)
    }
    try {
      await qrCheckin({ churchId, token, memberId })
      revalidatePath(`/${churchId}/dashboard/attendance/check-in/${token}`)
      redirect(`/${churchId}/dashboard/attendance/check-in/${token}?q=${encodeURIComponent(qParam)}&ok=1`)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'QR check-in failed.'
      redirect(`/${churchId}/dashboard/attendance/check-in/${token}?q=${encodeURIComponent(qParam)}&err=${encodeURIComponent(message)}`)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">QR Check-In</h1>
      <p className="text-sm text-muted-foreground">Token: {token}</p>

      <form className="flex max-w-xl gap-2" method="get">
        <input name="q" defaultValue={q} placeholder="Search member by name or phone" className="flex-1 rounded-md border px-3 py-2 text-sm" />
        <button type="submit" className="rounded-md border px-4 py-2 text-sm">Search</button>
      </form>

      {ok && (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          QR check-in completed.
        </div>
      )}
      {err && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {err}
        </div>
      )}

      <form action={submitAction} className="max-w-xl space-y-2 rounded-md border p-4">
        <input type="hidden" name="q" value={q} />
        <select name="memberId" className="w-full rounded-md border px-2 py-2 text-sm" required>
          <option value="">Select member</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>{member.firstName} {member.lastName}</option>
          ))}
        </select>
        <button disabled={!canManageAttendance} type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">Check In</button>
      </form>
      {!canManageAttendance && (
        <p className="text-sm text-muted-foreground">You can search members, but only permitted roles can submit check-ins.</p>
      )}
    </div>
  )
}
