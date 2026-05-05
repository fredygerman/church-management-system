import { revalidatePath } from 'next/cache'
import { listDuplicates, refreshDuplicates, resolveDuplicate } from '@/actions/data-quality'

interface PageProps { params: Promise<{ churchId: string }> }

export default async function DuplicateQueuePage({ params }: PageProps) {
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
      <div className="flex items-start justify-between"><h1 className="text-2xl font-semibold">Duplicate Review Queue</h1><form action={refreshAction}><button className="rounded-md border px-3 py-2 text-sm">Refresh</button></form></div>
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40"><tr><th className="px-3 py-2 text-left">Reason</th><th className="px-3 py-2 text-left">Confidence</th><th className="px-3 py-2 text-left">Action</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-3 py-2">{row.reason}</td>
                <td className="px-3 py-2">{row.confidenceScore}</td>
                <td className="px-3 py-2">
                  <form action={resolveAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={row.id} />
                    <select name="decision" className="rounded-md border px-2 py-1 text-xs"><option value="approve">approve+merge</option><option value="decline">decline</option><option value="ignore">ignore</option></select>
                    <button className="rounded border px-2 py-1 text-xs" type="submit">Apply</button>
                  </form>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={3} className="px-3 py-4 text-muted-foreground">No pending duplicate candidates.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
