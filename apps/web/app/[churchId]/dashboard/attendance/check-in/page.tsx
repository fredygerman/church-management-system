import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServiceSessions, manualCheckin, qrCheckin } from '@/actions/attendance'
import { searchMembers } from '@/actions/member'

interface PageProps {
  params: Promise<{ churchId: string }>
  searchParams: Promise<{ q?: string; ok?: string; err?: string }>
}

export default async function AttendanceCheckinPage({ params, searchParams }: PageProps) {
  const { churchId } = await params
  const { q = '', ok = '', err = '' } = await searchParams

  const [sessions, members] = await Promise.all([
    getServiceSessions(churchId).then((rows: any[]) => rows.filter((row) => row.status === 'open')).catch(() => []),
    q ? searchMembers(churchId, q).catch(() => []) : Promise.resolve([]),
  ])

  async function manualAction(formData: FormData) {
    'use server'
    const sessionId = String(formData.get('sessionId') || '')
    const memberId = String(formData.get('memberId') || '')
    const qParam = String(formData.get('q') || '')
    if (!sessionId || !memberId) {
      redirect(`/${churchId}/dashboard/attendance/check-in?q=${encodeURIComponent(qParam)}&err=${encodeURIComponent('Select both session and member.')}`)
    }
    try {
      await manualCheckin({ churchId, sessionId, memberId })
      revalidatePath(`/${churchId}/dashboard/attendance/check-in`)
      redirect(`/${churchId}/dashboard/attendance/check-in?q=${encodeURIComponent(qParam)}&ok=manual`)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Manual check-in failed.'
      redirect(`/${churchId}/dashboard/attendance/check-in?q=${encodeURIComponent(qParam)}&err=${encodeURIComponent(message)}`)
    }
  }

  async function qrAction(formData: FormData) {
    'use server'
    const token = String(formData.get('token') || '')
    const memberId = String(formData.get('memberId') || '')
    const qParam = String(formData.get('q') || '')
    if (!token || !memberId) {
      redirect(`/${churchId}/dashboard/attendance/check-in?q=${encodeURIComponent(qParam)}&err=${encodeURIComponent('Provide QR token and member.')}`)
    }
    try {
      await qrCheckin({ churchId, token, memberId })
      revalidatePath(`/${churchId}/dashboard/attendance/check-in`)
      redirect(`/${churchId}/dashboard/attendance/check-in?q=${encodeURIComponent(qParam)}&ok=qr`)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'QR check-in failed.'
      redirect(`/${churchId}/dashboard/attendance/check-in?q=${encodeURIComponent(qParam)}&err=${encodeURIComponent(message)}`)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Live Check-In</h1>
        <p className="text-sm text-muted-foreground">Use manual member selection or QR token check-in for open sessions.</p>
      </div>

      <form className="flex max-w-xl gap-2" method="get">
        <input name="q" defaultValue={q} placeholder="Search member by name or phone" className="flex-1 rounded-md border px-3 py-2 text-sm" />
        <button type="submit" className="rounded-md border px-4 py-2 text-sm">Search</button>
      </form>

      {ok && (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {ok === 'manual' ? 'Manual check-in completed.' : 'QR check-in completed.'}
        </div>
      )}
      {err && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {err}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <form action={manualAction} className="space-y-2 rounded-md border p-4">
          <input type="hidden" name="q" value={q} />
          <h2 className="font-medium">Manual Check-In</h2>
          <select name="sessionId" className="w-full rounded-md border px-2 py-2 text-sm" required>
            <option value="">Select open session</option>
            {sessions.map((session: any) => (
              <option key={session.id} value={session.id}>{session.title || session.serviceType?.name || session.sessionDate}</option>
            ))}
          </select>
          <select name="memberId" className="w-full rounded-md border px-2 py-2 text-sm" required>
            <option value="">Select member</option>
            {members.map((member: any) => (
              <option key={member.id} value={member.id}>{member.firstName} {member.lastName} {member.phone ? `(${member.phone})` : ''}</option>
            ))}
          </select>
          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Check In</button>
        </form>

        <form action={qrAction} className="space-y-2 rounded-md border p-4">
          <input type="hidden" name="q" value={q} />
          <h2 className="font-medium">QR Token Check-In</h2>
          <input name="token" placeholder="Paste session QR token" className="w-full rounded-md border px-2 py-2 text-sm" required />
          <select name="memberId" className="w-full rounded-md border px-2 py-2 text-sm" required>
            <option value="">Select member</option>
            {members.map((member: any) => (
              <option key={member.id} value={member.id}>{member.firstName} {member.lastName} {member.phone ? `(${member.phone})` : ''}</option>
            ))}
          </select>
          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Check In by QR</button>
        </form>
      </div>

      {sessions.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No open sessions.{" "}
          <Link className="underline" href={`/${churchId}/dashboard/attendance/sessions`}>
            Open a session first
          </Link>
          .
        </p>
      )}
    </div>
  )
}
