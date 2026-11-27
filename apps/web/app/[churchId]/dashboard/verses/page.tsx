import { loadVerseEntries, loadVerseOverrides, loadVerseToday } from "@/components/verses/actions"
import { VersesAdmin } from "@/components/verses/verses-admin"
import { VERSE_SCHEDULE_DAYS, addDays } from "@/components/verses/date-rows"
import { getLocale, getTranslator } from "@/lib/i18n/server"
import { checkPermission, ensurePermission } from "@/lib/permissions-server"

interface PageProps {
  params: Promise<{ churchId: string }>
}

export default async function VersesPage({ params }: PageProps) {
  await ensurePermission("view:verses")
  const { churchId } = await params
  const t = await getTranslator()
  const locale = await getLocale()
  const canManage = await checkPermission("manage:verses")

  // The API decides "today" in the church's time zone. Fall back to the server's UTC date only if that call fails.
  const today = await loadVerseToday(locale)
  const startDate = today.ok ? today.data.date : new Date().toISOString().slice(0, 10)
  const endDate = addDays(startDate, VERSE_SCHEDULE_DAYS - 1)

  const [entries, overrides] = await Promise.all([
    loadVerseEntries(),
    loadVerseOverrides(startDate, endDate),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("verses.heading")}</h1>
        <p className="text-sm text-muted-foreground">{t("verses.subtitle")}</p>
      </div>

      {entries.ok && overrides.ok ? (
        <VersesAdmin
          churchId={churchId}
          startDate={startDate}
          entries={entries.data}
          overrides={overrides.data}
          canManage={canManage}
        />
      ) : (
        <p className="text-sm text-destructive">{t("verses.error.generic")}</p>
      )}
    </div>
  )
}
