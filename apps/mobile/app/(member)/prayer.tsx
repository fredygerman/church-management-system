import { useState } from "react"
import { ScrollView, Text } from "react-native"
import { Button, Card, TextField } from "../../components/ui"
import { colors, spacing, type } from "../../theme"
import { ApiError, api } from "../../lib/api"
import { useT } from "../../lib/locale"
import { styles } from "../../components/screen-state"

export default function PrayerScreen() {
  const { t } = useT()
  const [content, setContent] = useState("")
  const [error, setError] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    setError(""); setConfirmation("")
    if (!content.trim()) { setError(t("mobile.member.prayer.emptyError")); return }
    setSubmitting(true)
    try {
      const result = await api.post<{ message?: string }>("/prayer-requests", { content })
      setConfirmation(result?.message || t("mobile.member.prayer.submitted")); setContent("")
    } catch (caught) { setError(caught instanceof ApiError ? caught.message : t("mobile.member.prayer.submitError")) }
    finally { setSubmitting(false) }
  }

  return <ScrollView contentContainerStyle={[styles.content, { backgroundColor: colors.canvas, padding: spacing.lg }]} keyboardShouldPersistTaps="handled">
    <Text style={{ ...type.h1, color: colors.ink }}>{t("mobile.member.prayer.title")}</Text>
    <Text style={styles.text}>{t("mobile.member.prayer.privacy")}</Text>
    <Card style={{ gap: spacing.md }}>
      <TextField accessibilityLabel={t("mobile.member.prayer.title")} editable={!submitting} multiline onChangeText={setContent} placeholder={t("mobile.member.prayer.placeholder")} style={{ minHeight: 144, textAlignVertical: "top" }} value={content} />
      {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
      {confirmation ? <Text accessibilityLiveRegion="polite" style={styles.success}>{confirmation}</Text> : null}
      <Button disabled={submitting} loading={submitting} title={submitting ? t("mobile.member.prayer.submitting") : t("mobile.member.prayer.submit")} onPress={() => void submit()} />
    </Card>
  </ScrollView>
}
