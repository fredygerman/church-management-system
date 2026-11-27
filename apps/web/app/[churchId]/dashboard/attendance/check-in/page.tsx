import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServiceSessions, manualCheckin, qrCheckin } from '@/actions/attendance'
import { searchMembers } from '@/actions/member'
import { checkPermission, ensurePermission } from '@/lib/permissions-server'
import { getTranslator } from '@/lib/i18n/server'
import { loadOrUnavailable } from '@/lib/load-or-unavailable'
import { UnavailableNotice } from '@/components/ui/unavailable-state'

interface PageProps {
  params: Promise<{ churchId: string }>
  searchParams: Promise<{ q?: string; ok?: string; err?: string }>
}

export default async function AttendanceCheckinPage({ params, searchParams }: PageProps) {
  await ensurePermission('view:attendance')
  const { churchId } = await params
  const { q = '', ok = '', err = '' } = await searchParams
  const t = await getTranslator()
  const canManageAttendance = await checkPermission('manage:attendance')

  const [sessionsResult, membersResult] = await Promise.all([
    loadOrUnavailable(async () => {
      const rows = await getServiceSessions(churchId)
      if (!Array.isArray(rows)) throw new Error('Unexpected service sessions response')
      return rows.filter((row: any) => row.status === 'open')
    }),
    q
      ? loadOrUnavailable(() => searchMembers(churchId, q, { throwOnError: true }))
      : Promise.resolve({ status: 'ok' as const, data: [] as any[] }),
  ])
  const sessionsFailed = sessionsResult.status === 'unavailable'
  const membersFailed = membersResult.status === 'unavailable'
  const sessions = sessionsResult.status === 'ok' ? sessionsResult.data : []
  const members = membersResult.status === 'ok' ? membersResult.data : []

  async function manualAction(formData: FormData) {
    'use server'
    const t = await getTranslator()
    const sessionId = String(formData.get('sessionId') || '')
    const memberId = String(formData.get('memberId') || '')
    const qParam = String(formData.get('q') || '')
    if (!sessionId || !memberId) {
      redirect(`/${churchId}/dashboard/attendance/check-in?q=${encodeURIComponent(qParam)}&err=${encodeURIComponent(t('staff.attendance.checkin.errSelectBoth'))}`)
    }
    if (!(await checkPermission('manage:attendance'))) {
      redirect(`/${churchId}/dashboard/attendance/check-in?q=${encodeURIComponent(qParam)}&err=${encodeURIComponent(t('staff.attendance.checkin.errNotAllowed'))}`)
    }
    try {
      await manualCheckin({ churchId, sessionId, memberId })
      revalidatePath(`/${churchId}/dashboard/attendance/check-in`)
      redirect(`/${churchId}/dashboard/attendance/check-in?q=${encodeURIComponent(qParam)}&ok=manual`)
    } catch (e) {
      const message = e instanceof Error ? e.message : t('staff.attendance.checkin.errManualFailed')
      redirect(`/${churchId}/dashboard/attendance/check-in?q=${encodeURIComponent(qParam)}&err=${encodeURIComponent(message)}`)
    }
  }

  async function qrAction(formData: FormData) {
    'use server'
    const t = await getTranslator()
    const token = String(formData.get('token') || '')
    const memberId = String(formData.get('memberId') || '')
    const qParam = String(formData.get('q') || '')
    if (!token || !memberId) {
      redirect(`/${churchId}/dashboard/attendance/check-in?q=${encodeURIComponent(qParam)}&err=${encodeURIComponent(t('staff.attendance.checkin.errProvide'))}`)
    }
    if (!(await checkPermission('manage:attendance'))) {
      redirect(`/${churchId}/dashboard/attendance/check-in?q=${encodeURIComponent(qParam)}&err=${encodeURIComponent(t('staff.attendance.checkin.errNotAllowed'))}`)
    }
    try {
      await qrCheckin({ churchId, token, memberId })
      revalidatePath(`/${churchId}/dashboard/attendance/check-in`)
      redirect(`/${churchId}/dashboard/attendance/check-in?q=${encodeURIComponent(qParam)}&ok=qr`)
    } catch (e) {
      const message = e instanceof Error ? e.message : t('staff.attendance.checkin.errQrFailed')
      redirect(`/${churchId}/dashboard/attendance/check-in?q=${encodeURIComponent(qParam)}&err=${encodeURIComponent(message)}`)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t('staff.attendance.checkin.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('staff.attendance.checkin.description')}</p>
      </div>

      <form className="flex max-w-xl gap-2" method="get">
        <input name="q" defaultValue={q} placeholder={t('staff.attendance.checkin.searchPlaceholder')} className="flex-1 rounded-md border px-3 py-2 text-sm" />
        <button type="submit" className="rounded-md border px-4 py-2 text-sm">{t('staff.attendance.checkin.search')}</button>
      </form>

      {ok && (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {ok === 'manual' ? t('staff.attendance.checkin.manualDone') : t('staff.attendance.checkin.qrDone')}
        </div>
      )}
      {err && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {err}
        </div>
      )}

      {(sessionsFailed || membersFailed) && (
        <UnavailableNotice title={t('staff.common.unavailableTitle')} message={t('staff.common.unavailableMessage')} />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <form action={manualAction} className="space-y-2 rounded-md border p-4">
          <input type="hidden" name="q" value={q} />
          <h2 className="font-medium">{t('staff.attendance.checkin.manualHeading')}</h2>
          <select name="sessionId" className="w-full rounded-md border px-2 py-2 text-sm" required>
            <option value="">{t('staff.attendance.checkin.selectSession')}</option>
            {sessions.map((session: any) => (
              <option key={session.id} value={session.id}>{session.title || session.serviceType?.name || session.sessionDate}</option>
            ))}
          </select>
          <select name="memberId" className="w-full rounded-md border px-2 py-2 text-sm" required>
            <option value="">{t('staff.attendance.checkin.selectMember')}</option>
            {members.map((member: any) => (
              <option key={member.id} value={member.id}>{member.firstName} {member.lastName} {member.phone ? `(${member.phone})` : ''}</option>
            ))}
          </select>
          <button type="submit" disabled={!canManageAttendance || sessionsFailed || membersFailed} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{t('staff.attendance.checkin.checkIn')}</button>
        </form>

        <form action={qrAction} className="space-y-2 rounded-md border p-4">
          <input type="hidden" name="q" value={q} />
          <h2 className="font-medium">{t('staff.attendance.checkin.qrHeading')}</h2>
          <input name="token" placeholder={t('staff.attendance.checkin.qrTokenPlaceholder')} className="w-full rounded-md border px-2 py-2 text-sm" required />
          <select name="memberId" className="w-full rounded-md border px-2 py-2 text-sm" required>
            <option value="">{t('staff.attendance.checkin.selectMember')}</option>
            {members.map((member: any) => (
              <option key={member.id} value={member.id}>{member.firstName} {member.lastName} {member.phone ? `(${member.phone})` : ''}</option>
            ))}
          </select>
          <button type="submit" disabled={!canManageAttendance || membersFailed} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{t('staff.attendance.checkin.checkInByQr')}</button>
        </form>
      </div>

      {!canManageAttendance && (
        <p className="text-sm text-muted-foreground">{t('staff.attendance.checkin.noPermission')}</p>
      )}

      {sessions.length === 0 && !sessionsFailed && (
        <p className="text-sm text-muted-foreground">
          {t('staff.attendance.noOpenSessions')}{" "}
          <Link className="underline" href={`/${churchId}/dashboard/attendance/sessions`}>
            {t('staff.attendance.checkin.openFirst')}
          </Link>
          .
        </p>
      )}
    </div>
  )
}
