import { useCallback, useEffect, useState } from "react"
import { Pressable, Text, View } from "react-native"
import { router } from "expo-router"
import { ApiError, api } from "../../lib/api"
import { useT } from "../../lib/locale"
import { EmptyState, ErrorState, LoadingState, styles } from "../../components/screen-state"

export default function EventsScreen() {
  const { t } = useT()
  const [events, setEvents] = useState<Record<string, unknown>[]>([]); const [error, setError] = useState(""); const [loading, setLoading] = useState(true)
  const load = useCallback(async () => { setLoading(true); try { const data = await api.get<Record<string, unknown>[]>("/events"); setEvents(Array.isArray(data) ? data : []); setError("") } catch (caught) { setError(caught instanceof ApiError ? caught.message : t("mobile.member.events.loadError")) } finally { setLoading(false) } }, [t])
  useEffect(() => { void load() }, [load])
  if (loading) return <LoadingState />; if (error) return <ErrorState message={error} onRetry={() => void load()} />; if (!events.length) return <EmptyState message={t("mobile.member.events.empty")} />
  return <View style={styles.content}>{events.map((event, index) => {
    const eventId = typeof event.id === "string" ? event.id : null
    const content = <><Text style={styles.heading}>{typeof event.title === "string" ? event.title : t("mobile.member.events.fallbackTitle")}</Text>{typeof event.description === "string" ? <Text style={styles.text}>{event.description}</Text> : null}{typeof event.startsAt === "string" ? <Text style={styles.text}>{event.startsAt}</Text> : null}{typeof event.location === "string" ? <Text style={styles.text}>{event.location}</Text> : null}</>
    return eventId ? <Pressable accessibilityRole="button" key={eventId} onPress={() => router.push(`/(member)/events/${eventId}`)} style={styles.card}>{content}</Pressable> : <View key={String(index)} style={styles.card}>{content}</View>
  })}</View>
}
