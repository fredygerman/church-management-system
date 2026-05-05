import { revalidatePath } from 'next/cache'
import { getRiskSettings, upsertRiskSettings } from '@/actions/attendance'

interface PageProps {
  params: Promise<{ churchId: string }>
}

export default async function AttendanceRiskSettingsPage({ params }: PageProps) {
  const { churchId } = await params
  const settings = await getRiskSettings(churchId).catch(() => null) as any

  async function saveAction(formData: FormData) {
    'use server'
    const threshold = Number(formData.get('consecutiveMissedThreshold') || 4)
    const isActive = formData.get('isActive') === 'on'
    if (!threshold || threshold < 1) return
    await upsertRiskSettings({ churchId, consecutiveMissedThreshold: threshold, isActive })
    revalidatePath(`/${churchId}/dashboard/attendance/risk-settings`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Risk Settings</h1>
        <p className="text-sm text-muted-foreground">Configure the consecutive missed-services threshold used for at-risk flags.</p>
      </div>

      <div className="rounded-md border p-4 text-sm">
        <p>Global Default Threshold: <span className="font-medium">{settings?.globalDefault?.consecutiveMissedThreshold ?? 4}</span></p>
        <p>Effective Threshold: <span className="font-medium">{settings?.effectiveThreshold ?? 4}</span></p>
      </div>

      <form action={saveAction} className="grid max-w-xl gap-3 rounded-md border p-4">
        <label className="grid gap-1 text-sm">
          Consecutive Missed Threshold
          <input
            name="consecutiveMissedThreshold"
            type="number"
            min={1}
            defaultValue={settings?.churchSetting?.consecutiveMissedThreshold ?? settings?.effectiveThreshold ?? 4}
            className="rounded-md border px-3 py-2"
            required
          />
        </label>

        <label className="inline-flex items-center gap-2 text-sm">
          <input
            name="isActive"
            type="checkbox"
            defaultChecked={settings?.churchSetting?.isActive ?? true}
          />
          Enable church override
        </label>

        <button type="submit" className="w-fit rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Save</button>
      </form>
    </div>
  )
}
