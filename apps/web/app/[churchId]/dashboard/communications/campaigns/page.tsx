import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { cancelCampaign, getCampaigns, sendCampaignNow } from '@/actions/communications'

interface PageProps {
  params: Promise<{ churchId: string }>
  searchParams: Promise<{ status?: string; channel?: string }>
}

export default async function CampaignsPage({ params, searchParams }: PageProps) {
  const { churchId } = await params
  const { status, channel } = await searchParams
  const campaigns = await getCampaigns(churchId, { status, channel }).catch(() => []) as any[]

  async function sendNowAction(formData: FormData) {
    'use server'
    const id = String(formData.get('id') || '')
    if (!id) return
    await sendCampaignNow({ churchId, id })
    revalidatePath(`/${churchId}/dashboard/communications/campaigns`)
  }

  async function cancelAction(formData: FormData) {
    'use server'
    const id = String(formData.get('id') || '')
    if (!id) return
    await cancelCampaign({ churchId, id })
    revalidatePath(`/${churchId}/dashboard/communications/campaigns`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Campaigns</h1>
          <p className="text-sm text-muted-foreground">Schedule or send campaigns and monitor delivery outcomes.</p>
        </div>
        <Link href={`/${churchId}/dashboard/communications/campaigns/new`} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">New Campaign</Link>
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
                    {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                      <form action={sendNowAction}>
                        <input type="hidden" name="id" value={campaign.id} />
                        <button className="rounded border px-2 py-1 text-xs" type="submit">Send Now</button>
                      </form>
                    )}
                    {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
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
