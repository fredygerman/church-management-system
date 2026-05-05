import { revalidatePath } from 'next/cache'
import { createServiceSession, getServiceSessions, getServiceTypes, updateServiceSessionStatus, upsertHeadcount } from '@/actions/attendance'

interface PageProps {
  params: Promise<{ churchId: string }>
}

export default async function AttendanceSessionsPage({ params }: PageProps) {
  const { churchId } = await params
  const [serviceTypes, sessions] = await Promise.all([
    getServiceTypes(churchId).catch(() => []) as Promise<any[]>,
    getServiceSessions(churchId).catch(() => []) as Promise<any[]>,
  ])

  async function createSessionAction(formData: FormData) {
    'use server'
    const serviceTypeId = String(formData.get('serviceTypeId') || '')
    const sessionDate = String(formData.get('sessionDate') || '')
    const title = String(formData.get('title') || '')
    if (!serviceTypeId || !sessionDate) return
    await createServiceSession({ churchId, serviceTypeId, sessionDate, title })
    revalidatePath(`/${churchId}/dashboard/attendance/sessions`)
  }

  async function statusAction(formData: FormData) {
    'use server'
    const id = String(formData.get('id') || '')
    const status = String(formData.get('status') || '') as 'draft' | 'open' | 'closed'
    if (!id || !status) return
    await updateServiceSessionStatus({ churchId, id, status })
    revalidatePath(`/${churchId}/dashboard/attendance/sessions`)
  }

  async function headcountAction(formData: FormData) {
    'use server'
    const sessionId = String(formData.get('sessionId') || '')
    if (!sessionId) return
    await upsertHeadcount({
      churchId,
      sessionId,
      menCount: Number(formData.get('menCount') || 0),
      womenCount: Number(formData.get('womenCount') || 0),
      childrenCount: Number(formData.get('childrenCount') || 0),
      visitorsCount: Number(formData.get('visitorsCount') || 0),
    })
    revalidatePath(`/${churchId}/dashboard/attendance/sessions`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Service Sessions</h1>
        <p className="text-sm text-muted-foreground">Create sessions and switch between draft/open/closed status.</p>
      </div>

      <form action={createSessionAction} className="grid gap-2 rounded-md border p-4 md:grid-cols-4">
        <select name="serviceTypeId" className="rounded-md border px-3 py-2 text-sm" required>
          <option value="">Select service type</option>
          {serviceTypes.map((type) => (
            <option key={type.id} value={type.id}>{type.name}</option>
          ))}
        </select>
        <input name="title" placeholder="Session title (optional)" className="rounded-md border px-3 py-2 text-sm" />
        <input name="sessionDate" type="date" className="rounded-md border px-3 py-2 text-sm" required />
        <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Create Session</button>
      </form>

      <div className="space-y-4">
        {sessions.map((session) => (
          <div key={session.id} className="rounded-md border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{session.title || session.serviceType?.name || 'Service Session'}</p>
                <p className="text-xs text-muted-foreground">{session.sessionDate} • Status: {session.status} • QR: {session.qrToken}</p>
              </div>
              <form action={statusAction} className="flex items-center gap-2">
                <input type="hidden" name="id" value={session.id} />
                <select name="status" defaultValue={session.status} className="rounded-md border px-2 py-1 text-sm">
                  <option value="draft">Draft</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
                <button className="rounded-md border px-3 py-1 text-sm" type="submit">Update</button>
              </form>
            </div>

            <form action={headcountAction} className="mt-3 grid gap-2 md:grid-cols-6">
              <input type="hidden" name="sessionId" value={session.id} />
              <input name="menCount" type="number" min={0} placeholder="Men" className="rounded-md border px-2 py-1 text-sm" />
              <input name="womenCount" type="number" min={0} placeholder="Women" className="rounded-md border px-2 py-1 text-sm" />
              <input name="childrenCount" type="number" min={0} placeholder="Children" className="rounded-md border px-2 py-1 text-sm" />
              <input name="visitorsCount" type="number" min={0} placeholder="Visitors" className="rounded-md border px-2 py-1 text-sm" />
              <button type="submit" className="rounded-md border px-3 py-1 text-sm">Save Headcount</button>
            </form>
          </div>
        ))}

        {sessions.length === 0 && <p className="text-sm text-muted-foreground">No sessions yet.</p>}
      </div>
    </div>
  )
}
