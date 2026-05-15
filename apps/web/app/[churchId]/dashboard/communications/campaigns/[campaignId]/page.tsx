import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCampaign, scheduleCampaign, sendCampaignNow, cancelCampaign } from '@/actions/communications'
import { checkPermission, ensurePermission } from '@/lib/permissions-server'

interface PageProps {
  params: Promise<{ churchId: string; campaignId: string }>
  searchParams: Promise<{ ok?: string; err?: string }>
}

export default async function CampaignDetailPage({ params, searchParams }: PageProps) {
  await ensurePermission('view:communications')
  const { churchId, campaignId } = await params
  const { ok = '', err = '' } = await searchParams
  const canManageCampaigns = await checkPermission('manage:communications')
  const canSendCampaigns = await checkPermission('send:communications')
  const data = await getCampaign(churchId, campaignId) as any

  async function scheduleAction(formData: FormData) {
    'use server'
    const scheduledAt = String(formData.get('scheduledAt') || '')
    if (!(await checkPermission('manage:communications'))) {
      redirect(`/${churchId}/dashboard/communications/campaigns/${campaignId}?err=${encodeURIComponent('You are not allowed to schedule campaigns.')}`)
    }
    if (!scheduledAt) {
      redirect(`/${churchId}/dashboard/communications/campaigns/${campaignId}?err=${encodeURIComponent('Provide a schedule date and time.')}`)
    }
    try {
      await scheduleCampaign({ churchId, id: campaignId, scheduledAt })
      revalidatePath(`/${churchId}/dashboard/communications/campaigns/${campaignId}`)
      redirect(`/${churchId}/dashboard/communications/campaigns/${campaignId}?ok=scheduled`)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to schedule campaign.'
      redirect(`/${churchId}/dashboard/communications/campaigns/${campaignId}?err=${encodeURIComponent(message)}`)
    }
  }

  async function sendNowAction() {
    'use server'
    if (!(await checkPermission('send:communications'))) {
      redirect(`/${churchId}/dashboard/communications/campaigns/${campaignId}?err=${encodeURIComponent('You are not allowed to send campaigns.')}`)
    }
    try {
      await sendCampaignNow({ churchId, id: campaignId })
      revalidatePath(`/${churchId}/dashboard/communications/campaigns/${campaignId}`)
      redirect(`/${churchId}/dashboard/communications/campaigns/${campaignId}?ok=sent`)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to send campaign.'
      redirect(`/${churchId}/dashboard/communications/campaigns/${campaignId}?err=${encodeURIComponent(message)}`)
    }
  }

  async function cancelAction() {
    'use server'
    if (!(await checkPermission('manage:communications'))) {
      redirect(`/${churchId}/dashboard/communications/campaigns/${campaignId}?err=${encodeURIComponent('You are not allowed to cancel campaigns.')}`)
    }
    try {
      await cancelCampaign({ churchId, id: campaignId })
      revalidatePath(`/${churchId}/dashboard/communications/campaigns/${campaignId}`)
      redirect(`/${churchId}/dashboard/communications/campaigns/${campaignId}?ok=cancelled`)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to cancel campaign.'
      redirect(`/${churchId}/dashboard/communications/campaigns/${campaignId}?err=${encodeURIComponent(message)}`)
    }
  }

  const campaign = data.campaign
  const analytics = data.analytics

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{campaign.name}</h1>
          <p className="text-sm text-muted-foreground">{campaign.channel.toUpperCase()} campaign • {campaign.status}</p>
        </div>
        <div className="flex items-center gap-2">
          {canSendCampaigns && (campaign.status === 'draft' || campaign.status === 'scheduled') && (
            <form action={sendNowAction}>
              <button className="rounded-md border px-3 py-2 text-sm" type="submit">Send Now</button>
            </form>
          )}
          {canManageCampaigns && (campaign.status === 'draft' || campaign.status === 'scheduled') && (
            <form action={cancelAction}>
              <button className="rounded-md border px-3 py-2 text-sm" type="submit">Cancel</button>
            </form>
          )}
        </div>
      </div>

      {ok && (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {ok === 'scheduled' ? 'Campaign scheduled.' : ok === 'sent' ? 'Campaign send started.' : 'Campaign cancelled.'}
        </div>
      )}
      {err && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {err}
        </div>
      )}

      <form action={scheduleAction} className="flex max-w-xl items-end gap-2 rounded-md border p-4">
        <label className="grid gap-1 text-sm">
          Schedule At
          <input name="scheduledAt" type="datetime-local" className="rounded-md border px-3 py-2 text-sm" required />
        </label>
        <button disabled={!canManageCampaigns} className="rounded-md border px-3 py-2 text-sm disabled:opacity-50" type="submit">Schedule</button>
      </form>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Targeted</p><p className="text-xl font-semibold">{analytics.totalTargeted}</p></div>
        <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Sent + Delivered</p><p className="text-xl font-semibold">{analytics.totalSent + analytics.totalDelivered}</p></div>
        <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Failed + Bounced</p><p className="text-xl font-semibold">{analytics.totalFailed + analytics.totalBounced}</p></div>
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">Recipient</th>
              <th className="px-3 py-2 text-left">Address</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Reason</th>
            </tr>
          </thead>
          <tbody>
            {data.recipients.map((recipient: any) => (
              <tr key={recipient.id} className="border-t">
                <td className="px-3 py-2">{recipient.fullName}</td>
                <td className="px-3 py-2">{recipient.recipientAddress}</td>
                <td className="px-3 py-2">{recipient.status}</td>
                <td className="px-3 py-2">{recipient.skipReason || '-'}</td>
              </tr>
            ))}
            {data.recipients.length === 0 && (
              <tr><td colSpan={4} className="px-3 py-4 text-muted-foreground">No recipients yet. Sending/scheduling will materialize recipients.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-md border p-4">
        <h2 className="font-medium">Recent Failures</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
          {analytics.recentFailureReasons?.length ? analytics.recentFailureReasons.map((reason: string, idx: number) => (
            <li key={idx}>{reason}</li>
          )) : <li>No recent failures</li>}
        </ul>
      </div>
    </div>
  )
}
