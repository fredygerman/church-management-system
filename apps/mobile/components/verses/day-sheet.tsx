import { ScrollView, Text } from "react-native"
import { useT } from "../../lib/locale"
import { styles as screenStyles } from "../screen-state"
import { Button, Card, EmptyState, ListRow, Sheet, SectionHeader } from "../ui"
import { spacing } from "../../theme"
import type { VerseDayRow } from "./next-days"
import type { VerseEntry } from "./verse-api"

export type DaySheetProps = {
  /** The day being changed, or null when the sheet is closed. */
  day: VerseDayRow | null
  /** Human label for the day, for example "Thu 28 Nov". */
  label: string
  /** Only active verses can be chosen for a day. */
  activeEntries: VerseEntry[]
  busy: boolean
  error: string
  onClose: () => void
  onChoose: (entryId: string) => void
  onClear: () => void
}

/** Picks the verse for one day, or hands the day back to the automatic rotation. */
export function DaySheet({ day, label, activeEntries, busy, error, onClose, onChoose, onClear }: DaySheetProps) {
  const { t } = useT()
  return <Sheet visible={day !== null} onClose={onClose} title={label} closeLabel={t("verses.cancel")}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.md }}>
      <SectionHeader title={t("verses.overrides.choose")} />
      {activeEntries.length === 0 ? <Card><EmptyState title={t("verses.list.empty")} /></Card> : activeEntries.map((entry) => (
        <Card key={entry.id} onPress={busy ? undefined : () => onChoose(entry.id)}>
          <ListRow icon="book-outline" title={entry.reference} subtitle={entry.textEn} />
        </Card>
      ))}
      {day?.source === "override" ? <Button title={t("verses.overrides.clear")} variant="secondary" icon="refresh-outline" loading={busy} disabled={busy} onPress={onClear} /> : null}
      {error ? <Text accessibilityLiveRegion="polite" style={screenStyles.error}>{error}</Text> : null}
    </ScrollView>
  </Sheet>
}
