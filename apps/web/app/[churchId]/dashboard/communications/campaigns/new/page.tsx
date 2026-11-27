import { redirect } from 'next/navigation'
import { createCampaign, getTemplates } from '@/actions/communications'
import { ensurePermission, checkPermission } from '@/lib/permissions-server'
import { getTranslator } from '@/lib/i18n/server'
import { loadOrUnavailable } from '@/lib/load-or-unavailable'
import { UnavailableNotice } from '@/components/ui/unavailable-state'

interface PageProps {
  params: Promise<{ churchId: string }>
  searchParams: Promise<{ err?: string }>
}

export default async function NewCampaignPage({ params, searchParams }: PageProps) {
  await ensurePermission('manage:communications')
  const { churchId } = await params
  const { err = '' } = await searchParams
  const t = await getTranslator()
  const templatesResult = await loadOrUnavailable(() => getTemplates(churchId))
  // Templates are optional (a body can be written instead), so the form stays usable on failure.
  const templates = (templatesResult.status === 'ok' && Array.isArray(templatesResult.data) ? templatesResult.data : []) as any[]

  async function createAction(formData: FormData) {
    'use server'
    const t = await getTranslator()
    if (!(await checkPermission('manage:communications'))) {
      redirect(`/${churchId}/dashboard/communications/campaigns/new?err=${encodeURIComponent(t('staff.communications.errors.notAllowedCreate'))}`)
    }
    const name = String(formData.get('name') || '')
    const channel = String(formData.get('channel') || 'sms') as 'sms' | 'email'
    const templateId = String(formData.get('templateId') || '')
    const subject = String(formData.get('subject') || '')
    const body = String(formData.get('body') || '')
    const scheduledAt = String(formData.get('scheduledAt') || '')
    const zoneIdsRaw = String(formData.get('zoneIds') || '')
    const gendersRaw = String(formData.get('genders') || '')

    if (!templateId && !body.trim()) {
      redirect(`/${churchId}/dashboard/communications/campaigns/new?err=${encodeURIComponent(t('staff.communications.errors.missingBody'))}`)
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
      const message = e instanceof Error ? e.message : t('staff.communications.errors.createFailed')
      redirect(`/${churchId}/dashboard/communications/campaigns/new?err=${encodeURIComponent(message)}`)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t('staff.communications.campaigns.new')}</h1>
        <p className="text-sm text-muted-foreground">{t('staff.communications.new.description')}</p>
      </div>

      {err && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {err}
        </div>
      )}

      {templatesResult.status === 'unavailable' && (
        <UnavailableNotice title={t('staff.common.unavailableTitle')} message={t('staff.common.unavailableMessage')} />
      )}

      <form action={createAction} className="grid gap-3 rounded-md border p-4">
        <div className="grid gap-2 md:grid-cols-2">
          <input name="name" placeholder={t('staff.communications.new.name')} className="rounded-md border px-3 py-2 text-sm" required />
          <select name="channel" className="rounded-md border px-3 py-2 text-sm" defaultValue="sms">
            <option value="sms">SMS</option>
            <option value="email">{t('staff.communications.channel.email')}</option>
          </select>
        </div>

        <select name="templateId" className="rounded-md border px-3 py-2 text-sm">
          <option value="">{t('staff.communications.new.noTemplate')}</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>{template.name} ({template.channel})</option>
          ))}
        </select>

        <input name="subject" placeholder={t('staff.communications.new.subject')} className="rounded-md border px-3 py-2 text-sm" />
        <textarea name="body" placeholder={t('staff.communications.new.body')} className="min-h-32 rounded-md border px-3 py-2 text-sm" />

        <div className="grid gap-2 md:grid-cols-3">
          <input name="zoneIds" placeholder={t('staff.communications.new.zoneIds')} className="rounded-md border px-3 py-2 text-sm" />
          <input name="genders" placeholder={t('staff.communications.new.genders')} className="rounded-md border px-3 py-2 text-sm" />
          <input name="scheduledAt" type="datetime-local" className="rounded-md border px-3 py-2 text-sm" />
        </div>

        <div className="flex items-center gap-2">
          <button type="submit" className="w-fit rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">{t('staff.communications.new.submit')}</button>
          <a href={`/${churchId}/dashboard/communications/campaigns`} className="rounded-md border px-4 py-2 text-sm">{t('common.cancel')}</a>
        </div>
      </form>
    </div>
  )
}
