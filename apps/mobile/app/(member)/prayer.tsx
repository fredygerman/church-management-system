import { useState } from "react"
import { Button, ScrollView, Text, TextInput } from "react-native"
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

  return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Text style={styles.title}>{t("mobile.member.prayer.title")}</Text>
    <Text style={styles.text}>{t("mobile.member.prayer.privacy")}</Text>
    <Text style={styles.formLabel}>{t("mobile.member.prayer.title")}</Text>
    <TextInput accessibilityLabel={t("mobile.member.prayer.title")} editable={!submitting} multiline onChangeText={setContent} placeholder={t("mobile.member.prayer.placeholder")} style={[styles.input, styles.multilineInput]} textAlignVertical="top" value={content} />
    {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
    {confirmation ? <Text accessibilityLiveRegion="polite" style={styles.success}>{confirmation}</Text> : null}
    <Button disabled={submitting} title={submitting ? t("mobile.member.prayer.submitting") : t("mobile.member.prayer.submit")} onPress={() => void submit()} />
  </ScrollView>
}
