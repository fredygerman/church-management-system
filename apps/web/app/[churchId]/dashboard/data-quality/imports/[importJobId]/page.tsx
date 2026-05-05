import { revalidatePath } from 'next/cache'
import { commitImport, getImportJob } from '@/actions/data-quality'

interface PageProps { params: Promise<{ churchId: string; importJobId: string }> }

export default async function ImportJobDetailPage({ params }: PageProps) {
  const { churchId, importJobId } = await params
  const data = await getImportJob(churchId, importJobId) as any

  async function commitAction(formData: FormData) {
    'use server'
    const mode = String(formData.get('mode') || 'create_and_update') as 'create_only' | 'update_only' | 'create_and_update'
    await commitImport({ churchId, importJobId, mode, idempotencyKey: `${importJobId}-${mode}` })
    revalidatePath(`/${churchId}/dashboard/data-quality/imports/${importJobId}`)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Import Job Detail</h1>
      <div className="rounded-md border p-4 text-sm">
        <p>File: {data.job.fileName}</p>
        <p>Status: {data.job.status}</p>
        <p>Rows: {data.job.totalRows} | Valid: {data.job.validRows} | Invalid: {data.job.invalidRows}</p>
      </div>
      {data.job.status !== 'committed' && (
        <form action={commitAction} className="flex items-end gap-2">
          <select name="mode" className="rounded-md border px-3 py-2 text-sm" defaultValue={data.job.mode}>
            <option value="create_only">create_only</option>
            <option value="update_only">update_only</option>
            <option value="create_and_update">create_and_update</option>
          </select>
          <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground" type="submit">Commit</button>
        </form>
      )}
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40"><tr><th className="px-3 py-2 text-left">Row</th><th className="px-3 py-2 text-left">Valid</th><th className="px-3 py-2 text-left">Errors</th><th className="px-3 py-2 text-left">Action</th></tr></thead>
          <tbody>
            {data.rows.map((row: any) => (
              <tr key={row.id} className="border-t"><td className="px-3 py-2">{row.rowNumber}</td><td className="px-3 py-2">{row.isValid ? 'Yes' : 'No'}</td><td className="px-3 py-2">{row.errors}</td><td className="px-3 py-2">{row.actionTaken || '-'}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
