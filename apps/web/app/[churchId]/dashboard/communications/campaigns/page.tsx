import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cancelCampaign, getCampaigns, sendCampaignNow } from '@/actions/communications'
import { checkPermission, ensurePermission } from '@/lib/permissions-server'

interface PageProps {
  params: Promise<{ churchId: string }>
  searchParams: Promise<{ status?: string; channel?: string; ok?: string; err?: string }>
}

export default async function CampaignsPage({ params, searchParams }: PageProps) {
  await ensurePermission('view:communications')
  const { churchId } = await params
  const { status, channel, ok = '', err = '' } = await searchParams
  const canManageCampaigns = await checkPermission('manage:communications')
  const canSendCampaigns = await checkPermission('send:communications')
  const campaigns = await getCampaigns(churchId, { status, channel }).catch(() => []) as any[]

  async function sendNowAction(formData: FormData) {
    'use server'
    const id = String(formData.get('id') || '')
    if (!id) redirect(`/${churchId}/dashboard/communications/campaigns?err=${encodeURIComponent('Missing campaign id.')}`)
    if (!(await checkPermission('send:communications'))) {
      redirect(`/${churchId}/dashboard/communications/campaigns?err=${encodeURIComponent('You are not allowed to send campaigns.')}`)
    }
    try {
      await sendCampaignNow({ churchId, id })
      revalidatePath(`/${churchId}/dashboard/communications/campaigns`)
      redirect(`/${churchId}/dashboard/communications/campaigns?ok=sent`)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to send campaign.'
      redirect(`/${churchId}/dashboard/communications/campaigns?err=${encodeURIComponent(message)}`)
    }
  }

  async function cancelAction(formData: FormData) {
    'use server'
    const id = String(formData.get('id') || '')
    if (!id) redirect(`/${churchId}/dashboard/communications/campaigns?err=${encodeURIComponent('Missing campaign id.')}`)
    if (!(await checkPermission('manage:communications'))) {
      redirect(`/${churchId}/dashboard/communications/campaigns?err=${encodeURIComponent('You are not allowed to cancel campaigns.')}`)
    }
    try {
      await cancelCampaign({ churchId, id })
      revalidatePath(`/${churchId}/dashboard/communications/campaigns`)
      redirect(`/${churchId}/dashboard/communications/campaigns?ok=cancelled`)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to cancel campaign.'
      redirect(`/${churchId}/dashboard/communications/campaigns?err=${encodeURIComponent(message)}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Campaigns</h1>
          <p className="text-sm text-muted-foreground">Schedule or send campaigns and monitor delivery outcomes.</p>
        </div>
        {canManageCampaigns && (
          <Link href={`/${churchId}/dashboard/communications/campaigns/new`} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">New Campaign</Link>
        )}
      </div>

      <form method="get" className="grid gap-2 rounded-md border p-4 md:grid-cols-3">
        <select name="status" defaultValue={status || ''} className="rounded-md border px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="sending">Sending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select name="channel" defaultValue={channel || ''} className="rounded-md border px-3 py-2 text-sm">
          <option value="">All channels</option>
          <option value="sms">SMS</option>
          <option value="email">Email</option>
        </select>
        <button type="submit" className="rounded-md border px-3 py-2 text-sm">Apply Filters</button>
      </form>

      {ok && (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {ok === 'sent' ? 'Campaign send started.' : 'Campaign cancelled.'}
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
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Channel</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Scheduled At</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="border-t">
                <td className="px-3 py-2">
                  <Link href={`/${churchId}/dashboard/communications/campaigns/${campaign.id}`} className="underline-offset-4 hover:underline">{campaign.name}</Link>
                </td>
                <td className="px-3 py-2 uppercase">{campaign.channel}</td>
                <td className="px-3 py-2">{campaign.status}</td>
                <td className="px-3 py-2">{campaign.scheduledAt || '-'}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {canSendCampaigns && (campaign.status === 'draft' || campaign.status === 'scheduled') && (
                      <form action={sendNowAction}>
                        <input type="hidden" name="id" value={campaign.id} />
                        <button className="rounded border px-2 py-1 text-xs" type="submit">Send Now</button>
                      </form>
                    )}
                    {canManageCampaigns && (campaign.status === 'draft' || campaign.status === 'scheduled') && (
                      <form action={cancelAction}>
                        <input type="hidden" name="id" value={campaign.id} />
                        <button className="rounded border px-2 py-1 text-xs" type="submit">Cancel</button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {campaigns.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-4 text-muted-foreground">No campaigns found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
