import { redirect } from 'next/navigation'
import { createCampaign, getTemplates } from '@/actions/communications'

interface PageProps {
  params: Promise<{ churchId: string }>
  searchParams: Promise<{ err?: string }>
}

export default async function NewCampaignPage({ params, searchParams }: PageProps) {
  const { churchId } = await params
  const { err = '' } = await searchParams
  const templates = await getTemplates(churchId).catch(() => []) as any[]

  async function createAction(formData: FormData) {
    'use server'
    const name = String(formData.get('name') || '')
    const channel = String(formData.get('channel') || 'sms') as 'sms' | 'email'
    const templateId = String(formData.get('templateId') || '')
    const subject = String(formData.get('subject') || '')
    const body = String(formData.get('body') || '')
    const scheduledAt = String(formData.get('scheduledAt') || '')
    const zoneIdsRaw = String(formData.get('zoneIds') || '')
    const gendersRaw = String(formData.get('genders') || '')

    if (!templateId && !body.trim()) {
      redirect(`/${churchId}/dashboard/communications/campaigns/new?err=${encodeURIComponent('Provide a message body or choose a template.')}`)
    }

    try {
      const campaign = await createCampaign({
        churchId,
        name,
        channel,
        templateId: templateId || undefined,
        subject: subject || undefined,
        body: body || undefined,
        scheduledAt: scheduledAt || undefined,
        audienceFilters: {
          zoneIds: zoneIdsRaw ? zoneIdsRaw.split(',').map((v) => v.trim()).filter(Boolean) : [],
          genders: gendersRaw ? gendersRaw.split(',').map((v) => v.trim()).filter(Boolean) : [],
        },
      }) as any

      redirect(`/${churchId}/dashboard/communications/campaigns/${campaign.id}?ok=created`)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to create campaign.'
      redirect(`/${churchId}/dashboard/communications/campaigns/new?err=${encodeURIComponent(message)}`)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New Campaign</h1>
        <p className="text-sm text-muted-foreground">Create a campaign and schedule it or send immediately.</p>
      </div>

      {err && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {err}
        </div>
      )}

      <form action={createAction} className="grid gap-3 rounded-md border p-4">
        <div className="grid gap-2 md:grid-cols-2">
          <input name="name" placeholder="Campaign name" className="rounded-md border px-3 py-2 text-sm" required />
          <select name="channel" className="rounded-md border px-3 py-2 text-sm" defaultValue="sms">
            <option value="sms">SMS</option>
            <option value="email">Email</option>
          </select>
        </div>

        <select name="templateId" className="rounded-md border px-3 py-2 text-sm">
          <option value="">No template (custom message)</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>{template.name} ({template.channel})</option>
          ))}
        </select>

        <input name="subject" placeholder="Subject (email)" className="rounded-md border px-3 py-2 text-sm" />
        <textarea name="body" placeholder="Body (required unless template is selected)" className="min-h-32 rounded-md border px-3 py-2 text-sm" />

        <div className="grid gap-2 md:grid-cols-3">
          <input name="zoneIds" placeholder="Zone IDs (comma separated)" className="rounded-md border px-3 py-2 text-sm" />
          <input name="genders" placeholder="Genders (comma: male,female)" className="rounded-md border px-3 py-2 text-sm" />
          <input name="scheduledAt" type="datetime-local" className="rounded-md border px-3 py-2 text-sm" />
        </div>

        <div className="flex items-center gap-2">
          <button type="submit" className="w-fit rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Create Campaign</button>
          <a href={`/${churchId}/dashboard/communications/campaigns`} className="rounded-md border px-4 py-2 text-sm">Cancel</a>
        </div>
      </form>
    </div>
  )
}
