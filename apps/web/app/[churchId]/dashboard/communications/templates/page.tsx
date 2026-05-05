import { revalidatePath } from 'next/cache'
import { createTemplate, getTemplates } from '@/actions/communications'

interface PageProps { params: Promise<{ churchId: string }> }

export default async function CommunicationTemplatesPage({ params }: PageProps) {
  const { churchId } = await params
  const templates = await getTemplates(churchId).catch(() => []) as any[]

  async function createAction(formData: FormData) {
    'use server'
    const name = String(formData.get('name') || '')
    const channel = String(formData.get('channel') || '') as 'sms' | 'email'
    const subject = String(formData.get('subject') || '')
    const body = String(formData.get('body') || '')
    if (!name || !channel || !body) return
    await createTemplate({ churchId, name, channel, subject: subject || undefined, body })
    revalidatePath(`/${churchId}/dashboard/communications/templates`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Message Templates</h1>
        <p className="text-sm text-muted-foreground">Create reusable templates with variables like <code>{'{{first_name}}'}</code>.</p>
      </div>

      <form action={createAction} className="grid gap-2 rounded-md border p-4">
        <div className="grid gap-2 md:grid-cols-3">
          <input name="name" placeholder="Template name" className="rounded-md border px-3 py-2 text-sm" required />
          <select name="channel" className="rounded-md border px-3 py-2 text-sm" required>
            <option value="sms">SMS</option>
            <option value="email">Email</option>
          </select>
          <input name="subject" placeholder="Subject (required for email)" className="rounded-md border px-3 py-2 text-sm" />
        </div>
        <textarea name="body" placeholder="Message body" className="min-h-28 rounded-md border px-3 py-2 text-sm" required />
        <button className="w-fit rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground" type="submit">Create Template</button>
      </form>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Channel</th>
              <th className="px-3 py-2 text-left">Active</th>
              <th className="px-3 py-2 text-left">Variables</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((template) => (
              <tr key={template.id} className="border-t">
                <td className="px-3 py-2">{template.name}</td>
                <td className="px-3 py-2 uppercase">{template.channel}</td>
                <td className="px-3 py-2">{template.isActive ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2">{template.variables}</td>
              </tr>
            ))}
            {templates.length === 0 && (
              <tr><td colSpan={4} className="px-3 py-4 text-muted-foreground">No templates yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
