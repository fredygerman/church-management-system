import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { listImportJobs, previewImport } from '@/actions/data-quality'
import { getTranslator } from '@/lib/i18n/server'

interface PageProps { params: Promise<{ churchId: string }> }

export default async function DataQualityPage({ params }: PageProps) {
  const t = await getTranslator()
  const { churchId } = await params
  const jobs = await listImportJobs(churchId).catch(() => []) as any[]

  async function previewAction(formData: FormData) {
    'use server'
    const fileName = String(formData.get('fileName') || 'manual.csv')
    const content = String(formData.get('content') || '')
    const mode = String(formData.get('mode') || 'create_and_update') as 'create_only' | 'update_only' | 'create_and_update'
    if (!content.trim()) return

    await previewImport({
      churchId,
      fileName,
      format: 'csv',
      content,
      mode,
      columnMapping: {
        firstName: 'firstName',
        lastName: 'lastName',
        phone: 'phone',
        gender: 'gender',
        maritalStatus: 'maritalStatus',
      },
    })

    revalidatePath(`/${churchId}/dashboard/data-quality`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('staff.dataQuality.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('staff.dataQuality.description')}</p>
        </div>
        <Link className="rounded-md border px-3 py-2 text-sm" href={`/${churchId}/dashboard/data-quality/duplicates`}>{t('staff.dataQuality.duplicateQueueLink')}</Link>
      </div>

      <form action={previewAction} className="grid gap-2 rounded-md border p-4">
        <input name="fileName" placeholder={t('staff.dataQuality.fileNamePlaceholder')} className="rounded-md border px-3 py-2 text-sm" defaultValue="members.csv" />
        <select name="mode" className="rounded-md border px-3 py-2 text-sm" defaultValue="create_and_update">
          <option value="create_only">{t('staff.dataQuality.mode.createOnly')}</option>
          <option value="update_only">{t('staff.dataQuality.mode.updateOnly')}</option>
          <option value="create_and_update">{t('staff.dataQuality.mode.createAndUpdate')}</option>
        </select>
        <textarea name="content" className="min-h-36 rounded-md border px-3 py-2 text-sm" placeholder={t('staff.dataQuality.pasteCsv')} required />
        <button className="w-fit rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground" type="submit">{t('staff.dataQuality.previewImport')}</button>
      </form>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">{t('staff.dataQuality.file')}</th><th className="px-3 py-2 text-left">{t('staff.dataQuality.status')}</th><th className="px-3 py-2 text-left">{t('staff.dataQuality.rows')}</th><th className="px-3 py-2 text-left">{t('staff.dataQuality.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="border-t">
                <td className="px-3 py-2">{job.fileName}</td>
                <td className="px-3 py-2">{job.status}</td>
                <td className="px-3 py-2">{t('staff.dataQuality.rowCounts', { total: job.totalRows, valid: job.validRows, invalid: job.invalidRows })}</td>
                <td className="px-3 py-2"><Link className="underline" href={`/${churchId}/dashboard/data-quality/imports/${job.id}`}>{t('staff.dataQuality.open')}</Link></td>
              </tr>
            ))}
            {!jobs.length && <tr><td colSpan={4} className="px-3 py-4 text-muted-foreground">{t('staff.dataQuality.noJobs')}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
