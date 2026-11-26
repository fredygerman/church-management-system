import { useCallback, useEffect, useState } from "react"
import { Text, View } from "react-native"
import { router } from "expo-router"
import { Card, ListRow } from "../../components/ui"
import { colors, spacing, type } from "../../theme"
import { ApiError, api } from "../../lib/api"
import { useT } from "../../lib/locale"
import { EmptyState, ErrorState, LoadingState, styles } from "../../components/screen-state"

export default function EventsScreen() {
  const { t } = useT()
  const [events, setEvents] = useState<Record<string, unknown>[]>([]); const [error, setError] = useState(""); const [loading, setLoading] = useState(true)
  const load = useCallback(async () => { setLoading(true); try { const data = await api.get<Record<string, unknown>[]>("/events"); setEvents(Array.isArray(data) ? data : []); setError("") } catch (caught) { setError(caught instanceof ApiError ? caught.message : t("mobile.member.events.loadError")) } finally { setLoading(false) } }, [t])
  useEffect(() => { void load() }, [load])
  if (loading) return <LoadingState />; if (error) return <ErrorState message={error} onRetry={() => void load()} />; if (!events.length) return <EmptyState message={t("mobile.member.events.empty")} />
  return <View style={[styles.content, { backgroundColor: colors.canvas, padding: spacing.lg }]}>{events.map((event, index) => {
    const eventId = typeof event.id === "string" ? event.id : null
    const title = typeof event.title === "string" ? event.title : t("mobile.member.events.fallbackTitle")
    const startsAt = typeof event.startsAt === "string" ? event.startsAt : ""
    const date = startsAt ? new Date(startsAt) : null
    const dateBlock = date && !Number.isNaN(date.getTime()) ? <View style={{ alignItems: "center", justifyContent: "center", width: 52, minHeight: 52, borderRadius: 12, backgroundColor: colors.tint }}><Text style={{ ...type.caption, color: colors.brand, fontWeight: "700" }}>{date.toLocaleString(undefined, { month: "short" })}</Text><Text style={{ ...type.h3, color: colors.ink }}>{date.getDate()}</Text></View> : undefined
    const subtitle = [typeof event.location === "string" ? event.location : null, startsAt].filter(Boolean).join(" · ")
    return <Card key={eventId ?? String(index)} onPress={eventId ? () => router.push(`/(member)/events/${eventId}`) : undefined} style={{ paddingVertical: spacing.md }}><ListRow icon="calendar-outline" title={title} subtitle={subtitle || undefined} trailing={dateBlock} /></Card>
  })}</View>
}
