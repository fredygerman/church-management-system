import { useCallback, useEffect, useState } from "react"
import { Text, View } from "react-native"
import type { MessageKey } from "@church/config"
import { ApiError, api } from "../../lib/api"
import { useT } from "../../lib/locale"
import { useSession } from "../../lib/session"
import { ErrorState, LoadingState, styles } from "../../components/screen-state"

// Server messages are shown as the server sent them; our own messages are translated at render time.
type Failure = { text: string } | { key: MessageKey }

export default function ChurchScreen() {
  const { t } = useT()
  const { user } = useSession(); const churchId = typeof user?.churchId === "string" ? user.churchId : null
  const [church, setChurch] = useState<Record<string, unknown> | null>(null); const [error, setError] = useState<Failure | null>(null); const [loading, setLoading] = useState(true)
  const load = useCallback(async () => { if (!churchId) { setError({ key: "mobile.shared.church.noChurch" }); setLoading(false); return }; setLoading(true); try { setChurch(await api.get<Record<string, unknown>>(`/churches/${churchId}`)) } catch (caught) { setError(caught instanceof ApiError ? { text: caught.message } : { key: "mobile.shared.church.loadError" }) } finally { setLoading(false) } }, [churchId])
  useEffect(() => { void load() }, [load])
  if (loading) return <LoadingState />
  if (error) return <ErrorState message={"text" in error ? error.text : t(error.key)} onRetry={() => void load()} />
  if (!church) return <ErrorState message={t("mobile.shared.church.unavailable")} onRetry={() => void load()} />
  return <View style={styles.content}><Text style={styles.title}>{typeof church.name === "string" ? church.name : t("mobile.shared.church.fallbackName")}</Text>{(["location", "leadPastorName", "phone", "email", "description"] as const).map((field) => typeof church[field] === "string" ? <Text key={field} style={styles.text}>{church[field]}</Text> : null)}</View>
}
