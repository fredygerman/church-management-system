import { useState } from "react"
import { Button, ScrollView, Text, TextInput, View } from "react-native"
import { validateAiResponse, type AiComponent } from "@church/config/ai"
import { AiResponseView } from "../components/ai/ai-response"
import { NotConnectedState } from "../components/not-connected-state"
import { styles } from "../components/screen-state"
import { ApiError, api } from "../lib/api"
import { useSession } from "../lib/session"

type Entry = { role: "user"; text: string } | { role: "assistant"; components: AiComponent[] | null }
type Status = { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string } | { kind: "unavailable"; message: string } | { kind: "not-connected" }

const UNAVAILABLE = "AI is not available right now"
const INVALID_ANSWER = "This answer could not be shown safely. Try asking again."

export default function AiScreen() {
  const { user } = useSession()
  const churchId = typeof user?.churchId === "string" ? user.churchId : undefined
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<Status>({ kind: "idle" })

  async function send(text: string) {
    setStatus({ kind: "loading" })
    try {
      const result = await api.post<{ conversationId: string; components: unknown }>("/ai/chat", {
        churchId,
        message: text,
        conversationId: conversationId ?? undefined,
      })
      const checked = validateAiResponse({ components: result.components })
      setConversationId(result.conversationId)
      setEntries((current) => [...current, { role: "user", text }, { role: "assistant", components: checked.ok ? checked.value.components : null }])
      setMessage((current) => (current === text ? "" : current))
      setStatus(checked.ok ? { kind: "idle" } : { kind: "error", message: INVALID_ANSWER })
    } catch (caught) {
      if (caught instanceof ApiError && caught.kind === "not-configured") setStatus({ kind: "not-connected" })
      else if (caught instanceof ApiError && caught.status === 503) setStatus({ kind: "unavailable", message: UNAVAILABLE })
      else setStatus({ kind: "error", message: caught instanceof ApiError ? caught.message : "Unable to reach the assistant. Try again." })
    }
  }

  function newConversation() {
    setConversationId(null)
    setEntries([])
    setMessage("")
    setStatus({ kind: "idle" })
  }

  if (status.kind === "not-connected") return <NotConnectedState area="Assistant" />

  const trimmed = message.trim()
  const busy = status.kind === "loading"

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Assistant</Text>
      <Text style={styles.text}>Answers use only the information your account can already see.</Text>

      {entries.map((entry, index) =>
        entry.role === "user" ? (
          <Text key={index} style={styles.heading}>You: {entry.text}</Text>
        ) : (
          <View key={index} style={{ marginBottom: 18 }}>
            {entry.components ? <AiResponseView components={entry.components} /> : <Text style={styles.error}>{INVALID_ANSWER}</Text>}
          </View>
        ),
      )}

      {status.kind === "loading" ? <Text style={styles.text}>Thinking…</Text> : null}
      {status.kind === "unavailable" || status.kind === "error" ? (
        <View style={{ gap: 10, marginBottom: 14 }}>
          <Text accessibilityLiveRegion="polite" style={styles.error}>{status.message}</Text>
          {status.kind === "error" && status.message !== INVALID_ANSWER ? <Button title="Try again" disabled={!trimmed} onPress={() => void send(trimmed)} /> : null}
        </View>
      ) : null}

      <Text style={styles.formLabel}>Your question</Text>
      <TextInput
        accessibilityLabel="Your question"
        editable={!busy}
        maxLength={1000}
        multiline
        onChangeText={setMessage}
        placeholder="Ask a question"
        style={[styles.input, styles.multilineInput]}
        textAlignVertical="top"
        value={message}
      />
      <Button disabled={busy || !trimmed || status.kind === "unavailable"} title={busy ? "Sending…" : "Send"} onPress={() => void send(trimmed)} />
      <View style={{ marginTop: 12 }}>
        <Button disabled={busy} title="New conversation" onPress={newConversation} />
      </View>
    </ScrollView>
  )
}
