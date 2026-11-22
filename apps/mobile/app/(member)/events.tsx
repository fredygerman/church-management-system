import { useCallback, useEffect, useState } from "react"
import { Text, View } from "react-native"
import { ApiError, api } from "../../lib/api"
import { EmptyState, ErrorState, LoadingState, styles } from "../../components/screen-state"

export default function EventsScreen() {
  const [events, setEvents] = useState<Record<string, unknown>[]>([]); const [error, setError] = useState(""); const [loading, setLoading] = useState(true)
  const load = useCallback(async () => { setLoading(true); try { const data = await api.get<Record<string, unknown>[]>("/events"); setEvents(Array.isArray(data) ? data : []); setError("") } catch (caught) { setError(caught instanceof ApiError ? caught.message : "Unable to load events.") } finally { setLoading(false) } }, [])
  useEffect(() => { void load() }, [load])
  if (loading) return <LoadingState />; if (error) return <ErrorState message={error} onRetry={() => void load()} />; if (!events.length) return <EmptyState message="There are no upcoming events." />
  return <View style={styles.content}>{events.map((event, index) => <View key={String(event.id ?? index)}><Text style={styles.heading}>{typeof event.title === "string" ? event.title : "Event"}</Text>{typeof event.description === "string" ? <Text style={styles.text}>{event.description}</Text> : null}{typeof event.startsAt === "string" ? <Text style={styles.text}>{event.startsAt}</Text> : null}{typeof event.location === "string" ? <Text style={styles.text}>{event.location}</Text> : null}</View>)}</View>
}
