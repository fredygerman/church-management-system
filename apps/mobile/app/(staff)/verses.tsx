import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native"
import { Stack } from "expo-router"
import { formatLocaleDate, type Locale, type MessageKey, type Translate } from "@church/config/i18n"
import { ApiError } from "../../lib/api"
import { useT } from "../../lib/locale"
import { createRequestGate } from "../../lib/request-gate"
import { useSession } from "../../lib/session"
import { ErrorState, LoadingState, styles } from "../../components/screen-state"
import { Button, Card, EmptyState, Pill, SectionHeader } from "../../components/ui"
import { DaySheet } from "../../components/verses/day-sheet"
import { EntrySheet } from "../../components/verses/entry-sheet"
import { addDays, buildNextDays, darTodayIso, type VerseDayRow, type VerseSource } from "../../components/verses/next-days"
import { roleHasVersePermission } from "../../components/verses/permissions"
import { verseApi, type VerseEntry, type VerseEntryInput, type VerseOverride } from "../../components/verses/verse-api"
import { colors, spacing, type } from "../../theme"

// Permissions: view:verses (GET entries, GET overrides); manage:verses (every write).
// Users without manage:verses see the same lists read-only. The API decides on every call.
const WINDOW_DAYS = 30

const SOURCE_KEY: Record<VerseSource, MessageKey> = {
  override: "verses.source.override",
  rotation: "verses.source.rotation",
  default: "verses.source.default",
}

function dayLabel(isoDate: string, locale: Locale): string {
  return formatLocaleDate(new Date(`${isoDate}T00:00:00Z`), locale, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })
}

/** The API sends {message, code}; lib/api.ts keeps only the status, so errors are mapped by status. */
function errorText(caught: unknown, t: Translate, isDayChange = false): string {
  if (caught instanceof ApiError) {
    if (caught.status === 403) return t("verses.error.noPermission")
    if (caught.status === 409 && isDayChange) return t("verses.overrides.pastDate")
  }
  return t("verses.error.generic")
}

export default function VersesScreen() {
  const { t, locale } = useT()
  const { user, contextKey } = useSession()
  const canManage = roleHasVersePermission(user?.activeRole, "manage:verses")
  const gate = useRef(createRequestGate()).current

  const [entries, setEntries] = useState<VerseEntry[]>([])
  const [overrides, setOverrides] = useState<VerseOverride[]>([])
  const [loadState, setLoadState] = useState<"loading" | "ready" | "denied" | "error">("loading")
  const [loadError, setLoadError] = useState("")
  const [busy, setBusy] = useState(false)
  const [listError, setListError] = useState("")
  const [listNotice, setListNotice] = useState("")
  const [editor, setEditor] = useState<{ entry: VerseEntry | null } | null>(null)
  const [editorError, setEditorError] = useState("")
  const [dayPick, setDayPick] = useState<VerseDayRow | null>(null)
  const [dayError, setDayError] = useState("")

  const hasActive = entries.some((entry) => entry.active)
  const activeEntries = useMemo(() => entries.filter((entry) => entry.active), [entries])
  const days = useMemo(() => buildNextDays(darTodayIso(), overrides, hasActive, WINDOW_DAYS), [overrides, hasActive])

  const load = useCallback(async () => {
    const isCurrent = gate.start()
    const today = darTodayIso()
    try {
      const [nextEntries, nextOverrides] = await Promise.all([
        verseApi.listEntries(),
        verseApi.listOverrides(today, addDays(today, WINDOW_DAYS - 1)),
      ])
      if (!isCurrent()) return
      setEntries(nextEntries)
      setOverrides(nextOverrides)
      setLoadError("")
      setLoadState("ready")
    } catch (caught) {
      if (!isCurrent()) return
      if (caught instanceof ApiError && caught.status === 403) {
        setLoadState("denied")
        return
      }
      setLoadError(caught instanceof ApiError ? caught.message : t("verses.error.generic"))
      setLoadState("error")
    }
  }, [gate, t])

  useEffect(() => {
    // Rows from the previous church or role must not show while this context loads.
    setEntries([])
    setOverrides([])
    setLoadState("loading")
    void load()
    return () => gate.invalidate()
  }, [load, contextKey, gate])

  // Runs one write, then reloads so the screen shows what the server now holds.
  const runWrite = async (write: () => Promise<unknown>, onError: (caught: unknown) => void, onDone?: () => void) => {
    setBusy(true)
    try {
      await write()
      onDone?.()
    } catch (caught) {
      onError(caught)
    } finally {
      setBusy(false)
      await load()
    }
  }

  const openEditor = (entry: VerseEntry | null) => {
    setEditorError("")
    setEditor({ entry })
  }

  const saveEntry = (input: VerseEntryInput) => {
    const current = editor?.entry ?? null
    void runWrite(
      () => (current ? verseApi.updateEntry(current.id, input) : verseApi.createEntry(input)),
      (caught) => setEditorError(errorText(caught, t)),
      () => {
        setEditor(null)
        setListError("")
        setListNotice(t("verses.saved"))
      },
    )
  }

  const toggleActive = (entry: VerseEntry) => {
    setListError("")
    setListNotice("")
    void runWrite(
      () => verseApi.updateEntry(entry.id, { active: !entry.active }),
      (caught) => setListError(errorText(caught, t)),
      () => setListNotice(t("verses.saved")),
    )
  }

  const removeEntry = (entry: VerseEntry) => {
    Alert.alert(t("verses.delete"), `${entry.reference}\n${t("verses.confirmDelete")}`, [
      { text: t("verses.cancel"), style: "cancel" },
      {
        text: t("verses.delete"),
        style: "destructive",
        onPress: () => {
          setListError("")
          setListNotice("")
          void runWrite(() => verseApi.deleteEntry(entry.id), (caught) => setListError(errorText(caught, t)))
        },
      },
    ])
  }

  const openDay = (day: VerseDayRow) => {
    setDayError("")
    setDayPick(day)
  }

  const chooseDay = (entryId: string) => {
    if (!dayPick) return
    const date = dayPick.date
    setDayError("")
    void runWrite(
      () => verseApi.setOverride(date, entryId),
      (caught) => setDayError(errorText(caught, t, true)),
      () => {
        setDayPick(null)
        setListError("")
        setListNotice(t("verses.saved"))
      },
    )
  }

  const clearDay = () => {
    if (!dayPick) return
    const date = dayPick.date
    setDayError("")
    void runWrite(
      () => verseApi.clearOverride(date),
      (caught) => setDayError(errorText(caught, t, true)),
      () => {
        setDayPick(null)
        setListError("")
        setListNotice(t("verses.saved"))
      },
    )
  }

  const titleOption = <Stack.Screen options={{ title: t("verses.title") }} />

  if (loadState === "loading") return <>{titleOption}<LoadingState /></>
  if (loadState === "denied") {
    return <>
      {titleOption}
      <View style={styles.center}>
        <Text style={styles.heading}>{t("verses.title")}</Text>
        <Text style={styles.text}>{t("verses.error.noPermission")}</Text>
      </View>
    </>
  }
  if (loadState === "error") {
    return <>
      {titleOption}
      <ErrorState message={loadError || t("verses.error.generic")} onRetry={() => { setLoadState("loading"); void load() }} />
    </>
  }

  return <>
    {titleOption}
    <ScrollView contentContainerStyle={local.content}>
      <Text style={local.heading}>{t("verses.heading")}</Text>
      <Text style={local.subtitle}>{t("verses.subtitle")}</Text>
      {canManage ? null : <Text style={local.note}>{t("verses.readOnly")}</Text>}
      {listError ? <Text accessibilityLiveRegion="polite" style={styles.error}>{listError}</Text> : null}
      {listNotice ? <Text accessibilityLiveRegion="polite" style={local.success}>{listNotice}</Text> : null}

      <SectionHeader title={t("verses.list.heading")} />
      {canManage ? <Button title={t("verses.add")} icon="add-outline" disabled={busy} onPress={() => openEditor(null)} /> : null}
      {entries.length === 0 ? <Card><EmptyState title={t("verses.list.empty")} /></Card> : entries.map((entry) => (
        <Card key={entry.id}>
          <View style={local.row}>
            <Text style={local.reference}>{entry.reference}</Text>
            <Pill label={entry.active ? t("verses.source.rotation") : t("verses.list.inactive")} tone={entry.active ? "success" : "default"} />
          </View>
          <Text numberOfLines={3} style={local.snippet}>{entry.textEn}</Text>
          {entry.textSw ? null : <Text style={local.caption}>{t("verses.swMissing")}</Text>}
          {canManage ? <View style={local.actions}>
            <Button title={t("verses.edit")} variant="secondary" icon="create-outline" disabled={busy} onPress={() => openEditor(entry)} />
            <Button title={entry.active ? t("verses.deactivate") : t("verses.activate")} variant="ghost" icon={entry.active ? "eye-off-outline" : "eye-outline"} disabled={busy} onPress={() => toggleActive(entry)} />
            <Button title={t("verses.delete")} variant="destructive" icon="trash-outline" disabled={busy} onPress={() => removeEntry(entry)} />
          </View> : null}
        </Card>
      ))}

      <SectionHeader title={t("verses.overrides.heading")} />
      {days.map((day) => {
        const body = <View style={local.row}>
          <View style={local.copy}>
            <Text style={local.reference}>{day.isToday ? `${dayLabel(day.date, locale)} · ${t("verses.today")}` : dayLabel(day.date, locale)}</Text>
            {day.reference ? <Text numberOfLines={2} style={local.snippet}>{day.reference}</Text> : null}
          </View>
          <Pill label={t(SOURCE_KEY[day.source])} tone={day.source === "override" ? "accent" : "default"} />
        </View>
        return canManage ? <Card key={day.date} onPress={() => openDay(day)}>{body}</Card> : <Card key={day.date}>{body}</Card>
      })}
    </ScrollView>

    <EntrySheet visible={editor !== null} entry={editor?.entry ?? null} busy={busy} error={editorError} onClose={() => setEditor(null)} onSave={saveEntry} />
    <DaySheet
      day={dayPick}
      label={dayPick ? dayLabel(dayPick.date, locale) : ""}
      activeEntries={activeEntries}
      busy={busy}
      error={dayError}
      onClose={() => setDayPick(null)}
      onChoose={chooseDay}
      onClear={clearDay}
    />
  </>
}

const local = StyleSheet.create({
  content: { backgroundColor: colors.canvas, padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  heading: { ...type.h1, color: colors.ink },
  subtitle: { ...type.supporting, color: colors.muted },
  note: { ...type.supporting, color: colors.warning },
  success: { ...type.supporting, color: colors.success },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  copy: { flex: 1, gap: spacing.xs },
  reference: { ...type.body, color: colors.ink, fontWeight: "600" },
  snippet: { ...type.supporting, color: colors.muted },
  caption: { ...type.caption, color: colors.warning },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
})
