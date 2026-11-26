import { useEffect, useRef, useState } from "react"
import { Text, View } from "react-native"
import type { MessageKey } from "@church/config/i18n"
import { ApiError, api } from "../../lib/api"
import { useT } from "../../lib/locale"
import { createRequestGate } from "../../lib/request-gate"
import { useSession } from "../../lib/session"
import { ErrorState, LoadingState, styles } from "../../components/screen-state"

// Server messages are shown as the server sent them; our own messages are translated at render time.
type Failure = { text: string } | { key: MessageKey }

export default function ChurchScreen() {
  const { t } = useT()
  const { user, contextKey } = useSession()
  const churchId = typeof user?.churchId === "string" ? user.churchId : null
  const gate = useRef(createRequestGate()).current
  const [church, setChurch] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<Failure | null>(null)
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const isCurrent = gate.start()
    // A new context or retry starts clean: no church or error from the previous attempt.
    setChurch(null)
    setError(null)
    if (!churchId) {
      setError({ key: "mobile.shared.church.noChurch" })
      setLoading(false)
      return () => gate.invalidate()
    }
    setLoading(true)
    api.get<Record<string, unknown>>(`/churches/${churchId}`).then(
      (data) => { if (isCurrent()) { setChurch(data); setLoading(false) } },
      (caught: unknown) => {
        if (!isCurrent()) return
        setError(caught instanceof ApiError ? { text: caught.message } : { key: "mobile.shared.church.loadError" })
        setLoading(false)
      },
    )
    return () => gate.invalidate()
  }, [churchId, contextKey, attempt, gate])

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={"text" in error ? error.text : t(error.key)} onRetry={() => setAttempt((value) => value + 1)} />
  if (!church) return <ErrorState message={t("mobile.shared.church.unavailable")} onRetry={() => setAttempt((value) => value + 1)} />
  return <View style={styles.content}><Text style={styles.title}>{typeof church.name === "string" ? church.name : t("mobile.shared.church.fallbackName")}</Text>{(["location", "leadPastorName", "phone", "email", "description"] as const).map((field) => typeof church[field] === "string" ? <Text key={field} style={styles.text}>{church[field]}</Text> : null)}</View>
}
