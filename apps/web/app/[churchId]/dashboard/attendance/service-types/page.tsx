import { revalidatePath } from 'next/cache'
import { createServiceType, getServiceTypes } from '@/actions/attendance'

interface PageProps {
  params: Promise<{ churchId: string }>
}

export default async function AttendanceServiceTypesPage({ params }: PageProps) {
  const { churchId } = await params
  const serviceTypes = await getServiceTypes(churchId).catch(() => []) as any[]

  async function createAction(formData: FormData) {
    'use server'
    const name = String(formData.get('name') || '')
    if (!name.trim()) return
    await createServiceType({ churchId, name: name.trim(), isActive: true })
    revalidatePath(`/${churchId}/dashboard/attendance/service-types`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Service Types</h1>
        <p className="text-sm text-muted-foreground">Create reusable templates like Sunday Worship or Midweek Service.</p>
      </div>

      <form action={createAction} className="flex gap-2 max-w-xl">
        <input name="name" placeholder="Service type name" className="flex-1 rounded-md border px-3 py-2 text-sm" required />
        <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Add</button>
      </form>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Active</th>
              <th className="px-3 py-2 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {serviceTypes.map((type) => (
              <tr key={type.id} className="border-t">
                <td className="px-3 py-2">{type.name}</td>
                <td className="px-3 py-2">{type.isActive ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2">{type.createdAt || '-'}</td>
              </tr>
            ))}
            {serviceTypes.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-4 text-muted-foreground">No service types yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
