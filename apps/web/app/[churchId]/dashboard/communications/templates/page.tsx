import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createTemplate, getTemplates } from '@/actions/communications'
import { UnavailableState } from '@/components/ui/unavailable-state'
import { getTranslator } from '@/lib/i18n/server'
import { loadOrUnavailable } from '@/lib/load-or-unavailable'

interface PageProps {
  params: Promise<{ churchId: string }>
  searchParams: Promise<{ error?: string }>
}

export default async function CommunicationTemplatesPage({ params, searchParams }: PageProps) {
  const { churchId } = await params
  const { error } = await searchParams
  const t = await getTranslator()
  const templatesResult = await loadOrUnavailable(() => getTemplates(churchId))
  // A failed request is shown as unavailable, not as "no templates yet".
  const templates = templatesResult.status === 'ok' ? (templatesResult.data as any[]) : null

  async function createAction(formData: FormData) {
    'use server'
    const name = String(formData.get('name') || '')
    const channel = String(formData.get('channel') || '') as 'sms' | 'email'
    const subject = String(formData.get('subject') || '')
    const body = String(formData.get('body') || '')
    if (!name || !channel || !body) {
      redirect(`/${churchId}/dashboard/communications/templates?error=required`)
    }
    await createTemplate({ churchId, name, channel, subject: subject || undefined, body })
    revalidatePath(`/${churchId}/dashboard/communications/templates`)
  }

  // The example variable contains braces, so it is passed as a value and split out to render as <code>.
  const sample = '{{first_name}}'
  const [descriptionBefore, descriptionAfter] = t('staff.communications.templates.description', { example: sample }).split(sample)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t('staff.communications.templates.title')}</h1>
        <p className="text-sm text-muted-foreground">{descriptionBefore}<code>{sample}</code>{descriptionAfter}</p>
      </div>

      <form action={createAction} className="grid gap-2 rounded-md border p-4">
        <div className="grid gap-2 md:grid-cols-3">
          <input name="name" placeholder={t('staff.communications.templates.name')} className="rounded-md border px-3 py-2 text-sm" required />
          <select name="channel" className="rounded-md border px-3 py-2 text-sm" required>
            <option value="sms">SMS</option>
            <option value="email">{t('staff.communications.channel.email')}</option>
          </select>
          <input name="subject" placeholder={t('staff.communications.templates.subject')} className="rounded-md border px-3 py-2 text-sm" />
        </div>
        <textarea name="body" placeholder={t('staff.communications.templates.body')} className="min-h-28 rounded-md border px-3 py-2 text-sm" required />
        {error === 'required' ? (
          <p role="alert" className="text-sm text-destructive">{t('staff.communications.templates.requiredError')}</p>
        ) : null}
        <button className="w-fit rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground" type="submit">{t('staff.communications.templates.create')}</button>
      </form>

      {templates ? <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">{t('staff.communications.table.name')}</th>
              <th className="px-3 py-2 text-left">{t('staff.communications.table.channel')}</th>
              <th className="px-3 py-2 text-left">{t('staff.communications.table.active')}</th>
              <th className="px-3 py-2 text-left">{t('staff.communications.table.variables')}</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((template) => (
              <tr key={template.id} className="border-t">
                <td className="px-3 py-2">{template.name}</td>
                <td className="px-3 py-2 uppercase">{template.channel}</td>
                <td className="px-3 py-2">{template.isActive ? t('staff.common.yes') : t('staff.common.no')}</td>
                <td className="px-3 py-2">{template.variables}</td>
              </tr>
            ))}
            {templates.length === 0 && (
              <tr><td colSpan={4} className="px-3 py-4 text-muted-foreground">{t('staff.communications.templates.empty')}</td></tr>
            )}
          </tbody>
        </table>
      </div> : <UnavailableState title={t('staff.common.unavailableTitle')} message={t('staff.common.unavailableMessage')} />}
    </div>
  )
}
