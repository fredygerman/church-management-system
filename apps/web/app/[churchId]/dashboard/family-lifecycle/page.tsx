import { revalidatePath } from 'next/cache'
import { createLifecycleRule, getFamilyLifecycleDashboard, listFamilySuggestions, resolveFamilySuggestion } from '@/actions/family-lifecycle'
import { getTranslator } from '@/lib/i18n/server'

interface PageProps { params: Promise<{ churchId: string }> }

export default async function FamilyLifecyclePage({ params }: PageProps) {
  const t = await getTranslator()
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
      <h1 className="text-2xl font-semibold">{t('staff.lifecycle.title')}</h1>
      <form action={ruleAction} className="grid gap-2 rounded-md border p-4 md:grid-cols-5">
        <select name="milestoneType" className="rounded-md border px-2 py-2 text-sm"><option value="birthday">{t('staff.lifecycle.milestone.birthday')}</option><option value="anniversary">{t('staff.lifecycle.milestone.anniversary')}</option><option value="baptism">{t('staff.lifecycle.milestone.baptism')}</option><option value="custom">{t('staff.lifecycle.milestone.custom')}</option></select>
        <input name="customMilestoneName" placeholder={t('staff.lifecycle.customNamePlaceholder')} className="rounded-md border px-2 py-2 text-sm" />
        <select name="channel" className="rounded-md border px-2 py-2 text-sm"><option value="sms">{t('staff.lifecycle.channel.sms')}</option><option value="email">{t('staff.lifecycle.channel.email')}</option></select>
        <select name="notifyTarget" className="rounded-md border px-2 py-2 text-sm"><option value="leader">{t('staff.lifecycle.notify.leader')}</option><option value="admin">{t('staff.lifecycle.notify.admin')}</option><option value="member">{t('staff.lifecycle.notify.member')}</option><option value="family_head">{t('staff.lifecycle.notify.familyHead')}</option></select>
        <input name="leadDays" defaultValue="0" className="rounded-md border px-2 py-2 text-sm" />
        <label className="col-span-full inline-flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked /> {t('staff.lifecycle.active')}</label>
        <button className="w-fit rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground" type="submit">{t('staff.lifecycle.addRule')}</button>
      </form>

      <div className="rounded-md border"><table className="w-full text-sm"><thead className="bg-muted/40"><tr><th className="px-3 py-2 text-left">{t('staff.lifecycle.upcomingMilestone')}</th><th className="px-3 py-2 text-left">{t('staff.lifecycle.date')}</th><th className="px-3 py-2 text-left">{t('staff.lifecycle.status')}</th></tr></thead><tbody>{dashboard.upcomingMilestones.map((m:any)=><tr key={m.id} className="border-t"><td className="px-3 py-2">{m.label}</td><td className="px-3 py-2">{m.milestoneDate}</td><td className="px-3 py-2">{m.status}</td></tr>)}{!dashboard.upcomingMilestones.length && <tr><td colSpan={3} className="px-3 py-4 text-muted-foreground">{t('staff.lifecycle.noMilestones')}</td></tr>}</tbody></table></div>

      <div className="rounded-md border"><table className="w-full text-sm"><thead className="bg-muted/40"><tr><th className="px-3 py-2 text-left">{t('staff.lifecycle.suggestion')}</th><th className="px-3 py-2 text-left">{t('staff.lifecycle.action')}</th></tr></thead><tbody>{suggestions.map((s:any)=><tr key={s.id} className="border-t"><td className="px-3 py-2">{s.reason}</td><td className="px-3 py-2"><form action={resolveAction} className="flex items-center gap-2"><input type="hidden" name="suggestionId" value={s.id} /><select name="decision" className="rounded-md border px-2 py-1 text-xs"><option value="approved">{t('staff.lifecycle.decision.approve')}</option><option value="declined">{t('staff.lifecycle.decision.decline')}</option><option value="ignored">{t('staff.lifecycle.decision.ignore')}</option></select><button className="rounded border px-2 py-1 text-xs" type="submit">{t('staff.lifecycle.apply')}</button></form></td></tr>)}{!suggestions.length && <tr><td colSpan={2} className="px-3 py-4 text-muted-foreground">{t('staff.lifecycle.noSuggestions')}</td></tr>}</tbody></table></div>
    </div>
  )
}
