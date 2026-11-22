import { useState } from "react"
import { Button, ScrollView, Text, TextInput } from "react-native"
import { ApiError, api } from "../../lib/api"
import { styles } from "../../components/screen-state"

export default function PrayerScreen() {
  const [content, setContent] = useState("")
  const [error, setError] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    setError(""); setConfirmation("")
    if (!content.trim()) { setError("Please enter a prayer request."); return }
    setSubmitting(true)
    try {
      const result = await api.post<{ message?: string }>("/prayer-requests", { content })
      setConfirmation(result?.message || "Your prayer request was submitted."); setContent("")
    } catch (caught) { setError(caught instanceof ApiError ? caught.message : "Unable to submit your prayer request. Try again.") }
    finally { setSubmitting(false) }
  }

  return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Text style={styles.title}>Prayer request</Text>
    <Text style={styles.text}>Your request follows the church's existing privacy rules.</Text>
    <Text style={styles.formLabel}>Prayer request</Text>
    <TextInput accessibilityLabel="Prayer request" editable={!submitting} multiline onChangeText={setContent} placeholder="Share your request" style={[styles.input, styles.multilineInput]} textAlignVertical="top" value={content} />
    {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
    {confirmation ? <Text accessibilityLiveRegion="polite" style={styles.success}>{confirmation}</Text> : null}
    <Button disabled={submitting} title={submitting ? "Submitting…" : "Submit request"} onPress={() => void submit()} />
    {/* TODO: Have fluent reviewers provide Swahili copy before localization. */}
  </ScrollView>
}
