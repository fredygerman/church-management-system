import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cancelCampaign, getCampaigns, sendCampaignNow } from '@/actions/communications'
import { checkPermission, ensurePermission } from '@/lib/permissions-server'
import { getTranslator } from '@/lib/i18n/server'

interface PageProps {
  params: Promise<{ churchId: string }>
  searchParams: Promise<{ status?: string; channel?: string; ok?: string; err?: string }>
}

// Status values are data; these keys only translate how they are labelled.
const statusKeys = {
  draft: 'staff.communications.status.draft',
  scheduled: 'staff.communications.status.scheduled',
  sending: 'staff.communications.status.sending',
  completed: 'staff.communications.status.completed',
  failed: 'staff.communications.status.failed',
  cancelled: 'staff.communications.status.cancelled',
} as const

export default async function CampaignsPage({ params, searchParams }: PageProps) {
  await ensurePermission('view:communications')
  const { churchId } = await params
  const { status, channel, ok = '', err = '' } = await searchParams
  const t = await getTranslator()
  const statusLabel = (value: string) => (value in statusKeys ? t(statusKeys[value as keyof typeof statusKeys]) : value)
  const canManageCampaigns = await checkPermission('manage:communications')
  const canSendCampaigns = await checkPermission('send:communications')
  const campaigns = await getCampaigns(churchId, { status, channel }).catch(() => []) as any[]

  async function sendNowAction(formData: FormData) {
    'use server'
    const t = await getTranslator()
    const id = String(formData.get('id') || '')
    if (!id) redirect(`/${churchId}/dashboard/communications/campaigns?err=${encodeURIComponent(t('staff.communications.errors.missingId'))}`)
    if (!(await checkPermission('send:communications'))) {
      redirect(`/${churchId}/dashboard/communications/campaigns?err=${encodeURIComponent(t('staff.communications.errors.notAllowedSend'))}`)
    }
    try {
      await sendCampaignNow({ churchId, id })
      revalidatePath(`/${churchId}/dashboard/communications/campaigns`)
      redirect(`/${churchId}/dashboard/communications/campaigns?ok=sent`)
    } catch (e) {
      const message = e instanceof Error ? e.message : t('staff.communications.errors.sendFailed')
      redirect(`/${churchId}/dashboard/communications/campaigns?err=${encodeURIComponent(message)}`)
    }
  }

  async function cancelAction(formData: FormData) {
    'use server'
    const t = await getTranslator()
    const id = String(formData.get('id') || '')
    if (!id) redirect(`/${churchId}/dashboard/communications/campaigns?err=${encodeURIComponent(t('staff.communications.errors.missingId'))}`)
    if (!(await checkPermission('manage:communications'))) {
      redirect(`/${churchId}/dashboard/communications/campaigns?err=${encodeURIComponent(t('staff.communications.errors.notAllowedCancel'))}`)
    }
    try {
      await cancelCampaign({ churchId, id })
      revalidatePath(`/${churchId}/dashboard/communications/campaigns`)
      redirect(`/${churchId}/dashboard/communications/campaigns?ok=cancelled`)
    } catch (e) {
      const message = e instanceof Error ? e.message : t('staff.communications.errors.cancelFailed')
      redirect(`/${churchId}/dashboard/communications/campaigns?err=${encodeURIComponent(message)}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('staff.communications.campaigns.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('staff.communications.campaigns.description')}</p>
        </div>
        {canManageCampaigns && (
          <Link href={`/${churchId}/dashboard/communications/campaigns/new`} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">{t('staff.communications.campaigns.new')}</Link>
        )}
      </div>

      <form method="get" className="grid gap-2 rounded-md border p-4 md:grid-cols-3">
        <select name="status" defaultValue={status || ''} className="rounded-md border px-3 py-2 text-sm">
          <option value="">{t('staff.communications.filters.allStatuses')}</option>
          <option value="draft">{statusLabel('draft')}</option>
          <option value="scheduled">{statusLabel('scheduled')}</option>
          <option value="sending">{statusLabel('sending')}</option>
          <option value="completed">{statusLabel('completed')}</option>
          <option value="failed">{statusLabel('failed')}</option>
          <option value="cancelled">{statusLabel('cancelled')}</option>
        </select>
        <select name="channel" defaultValue={channel || ''} className="rounded-md border px-3 py-2 text-sm">
          <option value="">{t('staff.communications.filters.allChannels')}</option>
          <option value="sms">SMS</option>
          <option value="email">{t('staff.communications.channel.email')}</option>
        </select>
        <button type="submit" className="rounded-md border px-3 py-2 text-sm">{t('staff.communications.filters.apply')}</button>
      </form>

      {ok && (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {ok === 'sent' ? t('staff.communications.campaigns.notice.sent') : t('staff.communications.campaigns.notice.cancelled')}
        </div>
      )}
      {err && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {err}
        </div>
      )}

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">{t('staff.communications.table.name')}</th>
              <th className="px-3 py-2 text-left">{t('staff.communications.table.channel')}</th>
              <th className="px-3 py-2 text-left">{t('staff.communications.table.status')}</th>
              <th className="px-3 py-2 text-left">{t('staff.communications.table.scheduledAt')}</th>
              <th className="px-3 py-2 text-left">{t('staff.communications.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="border-t">
                <td className="px-3 py-2">
                  <Link href={`/${churchId}/dashboard/communications/campaigns/${campaign.id}`} className="underline-offset-4 hover:underline">{campaign.name}</Link>
                </td>
                <td className="px-3 py-2 uppercase">{campaign.channel}</td>
                <td className="px-3 py-2">{statusLabel(campaign.status)}</td>
                <td className="px-3 py-2">{campaign.scheduledAt || '-'}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {canSendCampaigns && (campaign.status === 'draft' || campaign.status === 'scheduled') && (
                      <form action={sendNowAction}>
                        <input type="hidden" name="id" value={campaign.id} />
                        <button className="rounded border px-2 py-1 text-xs" type="submit">{t('staff.communications.campaigns.sendNow')}</button>
                      </form>
                    )}
                    {canManageCampaigns && (campaign.status === 'draft' || campaign.status === 'scheduled') && (
                      <form action={cancelAction}>
                        <input type="hidden" name="id" value={campaign.id} />
                        <button className="rounded border px-2 py-1 text-xs" type="submit">{t('common.cancel')}</button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {campaigns.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-4 text-muted-foreground">{t('staff.communications.campaigns.empty')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
