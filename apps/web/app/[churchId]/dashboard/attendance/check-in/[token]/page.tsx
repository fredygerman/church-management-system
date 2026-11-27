import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { qrCheckin } from '@/actions/attendance'
import { searchMembers } from '@/actions/member'
import { checkPermission, ensurePermission } from '@/lib/permissions-server'
import { getTranslator } from '@/lib/i18n/server'
import { loadOrUnavailable } from '@/lib/load-or-unavailable'
import { UnavailableNotice } from '@/components/ui/unavailable-state'

interface PageProps {
  params: Promise<{ churchId: string; token: string }>
  searchParams: Promise<{ q?: string; ok?: string; err?: string }>
}

export default async function QrCheckinTokenPage({ params, searchParams }: PageProps) {
  await ensurePermission('view:attendance')
  const { churchId, token } = await params
  const { q = '', ok = '', err = '' } = await searchParams
  const t = await getTranslator()
  const canManageAttendance = await checkPermission('manage:attendance')
  const membersResult = q
    ? await loadOrUnavailable(() => searchMembers(churchId, q, { throwOnError: true }))
    : { status: 'ok' as const, data: [] as any[] }
  const membersFailed = membersResult.status === 'unavailable'
  const members = membersResult.status === 'ok' ? membersResult.data : []

  async function submitAction(formData: FormData) {
    'use server'
    const t = await getTranslator()
    const memberId = String(formData.get('memberId') || '')
    const qParam = String(formData.get('q') || '')
    if (!memberId) {
      redirect(`/${churchId}/dashboard/attendance/check-in/${token}?q=${encodeURIComponent(qParam)}&err=${encodeURIComponent(t('staff.attendance.qrToken.errSelectMember'))}`)
    }
    if (!(await checkPermission('manage:attendance'))) {
      redirect(`/${churchId}/dashboard/attendance/check-in/${token}?q=${encodeURIComponent(qParam)}&err=${encodeURIComponent(t('staff.attendance.checkin.errNotAllowed'))}`)
    }
    try {
      await qrCheckin({ churchId, token, memberId })
      revalidatePath(`/${churchId}/dashboard/attendance/check-in/${token}`)
      redirect(`/${churchId}/dashboard/attendance/check-in/${token}?q=${encodeURIComponent(qParam)}&ok=1`)
    } catch (e) {
      const message = e instanceof Error ? e.message : t('staff.attendance.checkin.errQrFailed')
      redirect(`/${churchId}/dashboard/attendance/check-in/${token}?q=${encodeURIComponent(qParam)}&err=${encodeURIComponent(message)}`)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('staff.attendance.qrToken.title')}</h1>
      <p className="text-sm text-muted-foreground">{t('staff.attendance.qrToken.token', { token })}</p>

      <form className="flex max-w-xl gap-2" method="get">
        <input name="q" defaultValue={q} placeholder={t('staff.attendance.checkin.searchPlaceholder')} className="flex-1 rounded-md border px-3 py-2 text-sm" />
        <button type="submit" className="rounded-md border px-4 py-2 text-sm">{t('staff.attendance.checkin.search')}</button>
      </form>

      {ok && (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {t('staff.attendance.checkin.qrDone')}
        </div>
      )}
      {err && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {err}
        </div>
      )}

      {membersFailed && (
        <UnavailableNotice title={t('staff.common.unavailableTitle')} message={t('staff.common.unavailableMessage')} />
      )}

      <form action={submitAction} className="max-w-xl space-y-2 rounded-md border p-4">
        <input type="hidden" name="q" value={q} />
        <select name="memberId" className="w-full rounded-md border px-2 py-2 text-sm" required>
          <option value="">{t('staff.attendance.checkin.selectMember')}</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>{member.firstName} {member.lastName}</option>
          ))}
        </select>
        <button disabled={!canManageAttendance || membersFailed} type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{t('staff.attendance.checkin.checkIn')}</button>
      </form>
      {!canManageAttendance && (
        <p className="text-sm text-muted-foreground">{t('staff.attendance.qrToken.noPermission')}</p>
      )}
    </div>
  )
}
