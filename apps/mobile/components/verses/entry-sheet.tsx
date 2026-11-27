import { useEffect, useState } from "react"
import { ScrollView, Text } from "react-native"
import { useT } from "../../lib/locale"
import { styles as screenStyles } from "../screen-state"
import { Button, Sheet, TextField } from "../ui"
import { canSaveEntry, toEntryInput, type EntryFormValues } from "./entry-form"
import type { VerseEntry, VerseEntryInput } from "./verse-api"
import { colors, spacing, type } from "../../theme"

export type EntrySheetProps = {
  visible: boolean
  /** null creates a new verse; an entry opens it for editing. */
  entry: VerseEntry | null
  busy: boolean
  error: string
  onClose: () => void
  onSave: (input: VerseEntryInput) => void
}

const EMPTY: EntryFormValues = { reference: "", textEn: "", textSw: "" }

/** Add or edit one verse in the church list. Swahili text is optional and stays hidden in the app until approved (D-23). */
export function EntrySheet({ visible, entry, busy, error, onClose, onSave }: EntrySheetProps) {
  const { t } = useT()
  const [values, setValues] = useState<EntryFormValues>(EMPTY)

  // Each opening starts from the saved values of the verse being edited, or blank for a new one.
  useEffect(() => {
    if (!visible) return
    setValues(entry ? { reference: entry.reference, textEn: entry.textEn, textSw: entry.textSw ?? "" } : EMPTY)
  }, [visible, entry])

  const update = (field: keyof EntryFormValues) => (text: string) => setValues((current) => ({ ...current, [field]: text }))
  const canSave = canSaveEntry(values) && !busy

  return <Sheet visible={visible} onClose={onClose} title={entry ? t("verses.edit") : t("verses.add")} closeLabel={t("verses.cancel")}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.md }}>
      <TextField label={t("verses.field.reference")} placeholder={t("verses.field.referenceHint")} value={values.reference} onChangeText={update("reference")} editable={!busy} />
      <TextField label={t("verses.field.textEn")} value={values.textEn} onChangeText={update("textEn")} multiline textAlignVertical="top" style={{ minHeight: 96 }} editable={!busy} />
      <TextField label={t("verses.field.textSw")} value={values.textSw} onChangeText={update("textSw")} multiline textAlignVertical="top" style={{ minHeight: 96 }} editable={!busy} />
      <Text style={hintStyle}>{t("verses.field.textSwHint")}</Text>
      {error ? <Text accessibilityLiveRegion="polite" style={screenStyles.error}>{error}</Text> : null}
      <Button title={t("verses.save")} loading={busy} disabled={!canSave} onPress={() => onSave(toEntryInput(values, entry ? "update" : "create"))} />
    </ScrollView>
  </Sheet>
}

const hintStyle = { ...type.supporting, color: colors.muted }
