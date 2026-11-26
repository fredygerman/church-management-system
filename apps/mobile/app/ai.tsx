import { useState } from "react"
import { Button, ScrollView, Text, TextInput, View } from "react-native"
import { validateAiResponse, type AiComponent, type AiSource } from "@church/config/ai"
import { AiResponseView } from "../components/ai/ai-response"
import { NotConnectedState } from "../components/not-connected-state"
import { styles } from "../components/screen-state"
import { ApiError, api } from "../lib/api"
import { useSession } from "../lib/session"
import { useT } from "../lib/locale"

type Entry = { role: "user"; text: string } | { role: "assistant"; answerId: string; components: AiComponent[] | null; sources: AiSource[]; uncertain: boolean }
type FeedbackState = "helpful" | "not_helpful" | "failed"
// Error messages are chosen at render time so they follow the current language. A server message is kept as sent.
type Status = { kind: "idle" } | { kind: "loading" } | { kind: "error"; message?: string } | { kind: "invalid" } | { kind: "unavailable" } | { kind: "not-connected" }

// validateAiResponse only checks components, so sources and uncertain are read here, as plain titles.
function readSources(value: unknown): AiSource[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => (item && typeof item.title === "string" && item.title.length > 0 ? [{ title: item.title }] : []))
}

export default function AiScreen() {
  const { user } = useSession()
  const { t } = useT()
  const churchId = typeof user?.churchId === "string" ? user.churchId : undefined
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<Status>({ kind: "idle" })
  // Feedback per answer id, kept in component state only.
  const [feedback, setFeedback] = useState<Record<string, FeedbackState>>({})

  async function rate(answerId: string, rating: "helpful" | "not_helpful") {
    if (!conversationId || !answerId) return
    try {
      await api.post("/ai/feedback", { churchId, conversationId, answerId, rating })
      setFeedback((current) => ({ ...current, [answerId]: rating }))
    } catch {
      setFeedback((current) => ({ ...current, [answerId]: "failed" }))
    }
  }

  async function send(text: string) {
    setStatus({ kind: "loading" })
    try {
      const result = await api.post<{ conversationId: string; answerId?: unknown; components: unknown; sources?: unknown; uncertain?: unknown }>("/ai/chat", {
        churchId,
        message: text,
        conversationId: conversationId ?? undefined,
      })
      const checked = validateAiResponse({ components: result.components })
      const sources = readSources(result.sources)
      const uncertain = result.uncertain === true
      const answerId = typeof result.answerId === "string" ? result.answerId : ""
      setConversationId(result.conversationId)
      setEntries((current) => [...current, { role: "user", text }, { role: "assistant", answerId, components: checked.ok ? checked.value.components : null, sources, uncertain }])
      setMessage((current) => (current === text ? "" : current))
      setStatus(checked.ok ? { kind: "idle" } : { kind: "invalid" })
    } catch (caught) {
      if (caught instanceof ApiError && caught.kind === "not-configured") setStatus({ kind: "not-connected" })
      else if (caught instanceof ApiError && caught.status === 503) setStatus({ kind: "unavailable" })
      else setStatus({ kind: "error", message: caught instanceof ApiError ? caught.message : undefined })
    }
  }

  function newConversation() {
    setConversationId(null)
    setEntries([])
    setMessage("")
    setStatus({ kind: "idle" })
  }

  if (status.kind === "not-connected") return <NotConnectedState area={t("mobile.member.ai.title")} />

  const trimmed = message.trim()
  const busy = status.kind === "loading"
  const statusMessage = status.kind === "unavailable"
    ? t("mobile.member.ai.unavailable")
    : status.kind === "invalid"
      ? t("mobile.member.ai.invalidAnswer")
      : status.kind === "error"
        ? status.message ?? t("mobile.member.ai.unreachable")
        : ""

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{t("mobile.member.ai.title")}</Text>
      <Text style={styles.text}>{t("mobile.member.ai.intro")}</Text>

      {entries.map((entry, index) =>
        entry.role === "user" ? (
          <Text key={index} style={styles.heading}>{t("mobile.member.ai.you", { text: entry.text })}</Text>
        ) : (
          <View key={index} style={{ marginBottom: 18 }}>
            {entry.components ? <AiResponseView components={entry.components} /> : <Text style={styles.error}>{t("mobile.member.ai.invalidAnswer")}</Text>}
            {entry.components && entry.sources.length > 0 ? <Text style={styles.text}>{t("mobile.member.ai.sources", { sources: entry.sources.map((source) => source.title).join(", ") })}</Text> : null}
            {entry.components && entry.uncertain ? <Text style={styles.text}>{t("mobile.member.ai.uncertain")}</Text> : null}
            {entry.components && entry.answerId ? (
              feedback[entry.answerId] === "helpful" || feedback[entry.answerId] === "not_helpful" ? (
                <Text accessibilityLiveRegion="polite" style={styles.text}>{t("component.ai.feedback.thanks")}</Text>
              ) : (
                <View style={{ gap: 8 }}>
                  <Text style={styles.text}>{t("component.ai.feedback.label")}</Text>
                  <Button title={t("component.ai.feedback.helpful")} onPress={() => void rate(entry.answerId, "helpful")} />
                  <Button title={t("component.ai.feedback.notHelpful")} onPress={() => void rate(entry.answerId, "not_helpful")} />
                </View>
              )
            ) : null}
            {feedback[entry.answerId] === "failed" ? <Text accessibilityLiveRegion="polite" style={styles.error}>{t("component.ai.feedback.failed")}</Text> : null}
          </View>
        ),
      )}

      {status.kind === "loading" ? <Text style={styles.text}>{t("mobile.member.ai.thinking")}</Text> : null}
      {status.kind === "unavailable" || status.kind === "error" || status.kind === "invalid" ? (
        <View style={{ gap: 10, marginBottom: 14 }}>
          <Text accessibilityLiveRegion="polite" style={styles.error}>{statusMessage}</Text>
          {status.kind === "error" ? <Button title={t("common.retry")} disabled={!trimmed} onPress={() => void send(trimmed)} /> : null}
        </View>
      ) : null}

      <Text style={styles.formLabel}>{t("mobile.member.ai.question")}</Text>
      <TextInput
        accessibilityLabel={t("mobile.member.ai.question")}
        editable={!busy}
        maxLength={1000}
        multiline
        onChangeText={setMessage}
        placeholder={t("mobile.member.ai.placeholder")}
        style={[styles.input, styles.multilineInput]}
        textAlignVertical="top"
        value={message}
      />
      <Button disabled={busy || !trimmed || status.kind === "unavailable"} title={busy ? t("mobile.member.ai.sending") : t("mobile.member.ai.send")} onPress={() => void send(trimmed)} />
      <View style={{ marginTop: 12 }}>
        <Button disabled={busy} title={t("mobile.member.ai.newConversation")} onPress={newConversation} />
      </View>
    </ScrollView>
  )
}
