import { revalidatePath } from 'next/cache'
import { listDuplicates, refreshDuplicates, resolveDuplicate } from '@/actions/data-quality'
import { getTranslator } from '@/lib/i18n/server'

interface PageProps { params: Promise<{ churchId: string }> }

export default async function DuplicateQueuePage({ params }: PageProps) {
  const t = await getTranslator()
  const { churchId } = await params
  const rows = await listDuplicates(churchId).catch(() => []) as any[]

  async function refreshAction() {
    'use server'
    await refreshDuplicates(churchId)
    revalidatePath(`/${churchId}/dashboard/data-quality/duplicates`)
  }

  async function resolveAction(formData: FormData) {
    'use server'
    const id = String(formData.get('id') || '')
    const decision = String(formData.get('decision') || 'ignore') as 'approve' | 'decline' | 'ignore'
    if (!id) return
    await resolveDuplicate({ churchId, candidateId: id, decision })
    revalidatePath(`/${churchId}/dashboard/data-quality/duplicates`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between"><h1 className="text-2xl font-semibold">{t('staff.dataQuality.duplicates.title')}</h1><form action={refreshAction}><button className="rounded-md border px-3 py-2 text-sm">{t('staff.dataQuality.duplicates.refresh')}</button></form></div>
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40"><tr><th className="px-3 py-2 text-left">{t('staff.dataQuality.duplicates.reason')}</th><th className="px-3 py-2 text-left">{t('staff.dataQuality.duplicates.confidence')}</th><th className="px-3 py-2 text-left">{t('staff.dataQuality.duplicates.action')}</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-3 py-2">{row.reason}</td>
                <td className="px-3 py-2">{row.confidenceScore}</td>
                <td className="px-3 py-2">
                  <form action={resolveAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={row.id} />
                    <select name="decision" className="rounded-md border px-2 py-1 text-xs"><option value="approve">{t('staff.dataQuality.duplicates.decision.approveMerge')}</option><option value="decline">{t('staff.dataQuality.duplicates.decision.decline')}</option><option value="ignore">{t('staff.dataQuality.duplicates.decision.ignore')}</option></select>
                    <button className="rounded border px-2 py-1 text-xs" type="submit">{t('staff.dataQuality.duplicates.apply')}</button>
                  </form>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={3} className="px-3 py-4 text-muted-foreground">{t('staff.dataQuality.duplicates.empty')}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
