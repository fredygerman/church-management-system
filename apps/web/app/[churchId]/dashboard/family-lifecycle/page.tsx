import { revalidatePath } from 'next/cache'
import { createLifecycleRule, getFamilyLifecycleDashboard, listFamilySuggestions, resolveFamilySuggestion } from '@/actions/family-lifecycle'

interface PageProps { params: Promise<{ churchId: string }> }

export default async function FamilyLifecyclePage({ params }: PageProps) {
  const { churchId } = await params
  const [dashboard, suggestions] = await Promise.all([
    getFamilyLifecycleDashboard(churchId).catch(() => ({ upcomingMilestones: [], pendingConnections: [], recentRelationships: [] })),
    listFamilySuggestions(churchId).catch(() => []),
  ]) as any

  async function ruleAction(formData: FormData) {
    'use server'
    await createLifecycleRule({
      churchId,
      milestoneType: String(formData.get('milestoneType') || 'birthday') as any,
      customMilestoneName: String(formData.get('customMilestoneName') || '') || undefined,
      channel: String(formData.get('channel') || 'sms') as any,
      notifyTarget: String(formData.get('notifyTarget') || 'leader') as any,
      leadDays: String(formData.get('leadDays') || '0'),
      isActive: formData.get('isActive') === 'on',
    })
    revalidatePath(`/${churchId}/dashboard/family-lifecycle`)
  }

  async function resolveAction(formData: FormData) {
    'use server'
    const suggestionId = String(formData.get('suggestionId') || '')
    const decision = String(formData.get('decision') || 'ignored') as 'approved' | 'declined' | 'ignored'
    if (!suggestionId) return
    await resolveFamilySuggestion({ churchId, suggestionId, decision })
    revalidatePath(`/${churchId}/dashboard/family-lifecycle`)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Family & Lifecycle</h1>
      <form action={ruleAction} className="grid gap-2 rounded-md border p-4 md:grid-cols-5">
        <select name="milestoneType" className="rounded-md border px-2 py-2 text-sm"><option value="birthday">birthday</option><option value="anniversary">anniversary</option><option value="baptism">baptism</option><option value="custom">custom</option></select>
        <input name="customMilestoneName" placeholder="custom name" className="rounded-md border px-2 py-2 text-sm" />
        <select name="channel" className="rounded-md border px-2 py-2 text-sm"><option value="sms">sms</option><option value="email">email</option></select>
        <select name="notifyTarget" className="rounded-md border px-2 py-2 text-sm"><option value="leader">leader</option><option value="admin">admin</option><option value="member">member</option><option value="family_head">family_head</option></select>
        <input name="leadDays" defaultValue="0" className="rounded-md border px-2 py-2 text-sm" />
        <label className="col-span-full inline-flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked /> Active</label>
        <button className="w-fit rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground" type="submit">Add Rule</button>
      </form>

      <div className="rounded-md border"><table className="w-full text-sm"><thead className="bg-muted/40"><tr><th className="px-3 py-2 text-left">Upcoming Milestone</th><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Status</th></tr></thead><tbody>{dashboard.upcomingMilestones.map((m:any)=><tr key={m.id} className="border-t"><td className="px-3 py-2">{m.label}</td><td className="px-3 py-2">{m.milestoneDate}</td><td className="px-3 py-2">{m.status}</td></tr>)}{!dashboard.upcomingMilestones.length && <tr><td colSpan={3} className="px-3 py-4 text-muted-foreground">No upcoming milestones.</td></tr>}</tbody></table></div>

      <div className="rounded-md border"><table className="w-full text-sm"><thead className="bg-muted/40"><tr><th className="px-3 py-2 text-left">Suggestion</th><th className="px-3 py-2 text-left">Action</th></tr></thead><tbody>{suggestions.map((s:any)=><tr key={s.id} className="border-t"><td className="px-3 py-2">{s.reason}</td><td className="px-3 py-2"><form action={resolveAction} className="flex items-center gap-2"><input type="hidden" name="suggestionId" value={s.id} /><select name="decision" className="rounded-md border px-2 py-1 text-xs"><option value="approved">approve</option><option value="declined">decline</option><option value="ignored">ignore</option></select><button className="rounded border px-2 py-1 text-xs" type="submit">Apply</button></form></td></tr>)}{!suggestions.length && <tr><td colSpan={2} className="px-3 py-4 text-muted-foreground">No pending suggestions.</td></tr>}</tbody></table></div>
    </div>
  )
}
