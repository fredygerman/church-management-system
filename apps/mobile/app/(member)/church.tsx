import { useCallback, useEffect, useState } from "react"
import { Text, View } from "react-native"
import { ApiError, api } from "../../lib/api"
import { useSession } from "../../lib/session"
import { ErrorState, LoadingState, styles } from "../../components/screen-state"

export default function ChurchScreen() {
  const { user } = useSession(); const churchId = typeof user?.churchId === "string" ? user.churchId : null
  const [church, setChurch] = useState<Record<string, unknown> | null>(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(true)
  const load = useCallback(async () => { if (!churchId) { setError("Your account does not include a church."); setLoading(false); return }; setLoading(true); try { setChurch(await api.get<Record<string, unknown>>(`/churches/${churchId}`)) } catch (caught) { setError(caught instanceof ApiError ? caught.message : "Unable to load church information.") } finally { setLoading(false) } }, [churchId])
  useEffect(() => { void load() }, [load])
  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />
  if (!church) return <ErrorState message="Church information is unavailable." onRetry={() => void load()} />
  return <View style={styles.content}><Text style={styles.title}>{typeof church.name === "string" ? church.name : "Church"}</Text>{(["location", "leadPastorName", "phone", "email", "description"] as const).map((field) => typeof church[field] === "string" ? <Text key={field} style={styles.text}>{church[field]}</Text> : null)}</View>
}
