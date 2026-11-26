import { useCallback, useEffect, useMemo, useState } from "react"
import { ScrollView, Text, View } from "react-native"
import { router } from "expo-router"
import { colors, spacing, type } from "../../theme"
import { ApiError, api } from "../../lib/api"
import { useT } from "../../lib/locale"
import { EmptyState, ErrorState, LoadingState, styles } from "../../components/screen-state"
import { SegmentedControl } from "../../components/events/segmented-control"
import { EventCard } from "../../components/events/event-card"
import { ServiceRow } from "../../components/events/service-row"
import { copy, todayKey } from "../../components/events/format"
import { normalizeEvent, serviceSchedule, toRsvpStatus, upcomingEvents, type EventRecord, type RsvpStatus, type ServiceSession } from "../../components/events/model"

type Tab = "services" | "events"

function apiMessage(error: unknown, fallback: string) { return error instanceof ApiError ? error.message : fallback }

export default function EventsScreen() {
  const { t, locale } = useT()
  const [tab, setTab] = useState<Tab>("services")
  const [events, setEvents] = useState<EventRecord[]>([])
  const [rsvps, setRsvps] = useState<Record<string, RsvpStatus>>({})
  const [sessions, setSessions] = useState<ServiceSession[]>([])
  const [loading, setLoading] = useState(true)
  const [eventsError, setEventsError] = useState("")
  const [servicesError, setServicesError] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [eventsResult, rsvpResult, sessionsResult] = await Promise.allSettled([
      api.get<Record<string, unknown>[]>("/events"),
      api.get<Record<string, unknown>[]>("/events/me"),
      api.get<ServiceSession[]>("/attendance/sessions"),
    ])
    if (eventsResult.status === "fulfilled") {
      const rows = Array.isArray(eventsResult.value) ? eventsResult.value : []
      setEvents(rows.map(normalizeEvent).filter((event): event is EventRecord => event !== null))
      setEventsError("")
    } else {
      setEvents([])
      setEventsError(apiMessage(eventsResult.reason, t("mobile.member.events.loadError")))
    }
    const byEvent: Record<string, RsvpStatus> = {}
    if (rsvpResult.status === "fulfilled" && Array.isArray(rsvpResult.value)) {
      for (const row of rsvpResult.value) {
        const status = toRsvpStatus(row.status)
        if (typeof row.eventId === "string" && status) byEvent[row.eventId] = status
      }
    }
    setRsvps(byEvent)
    if (sessionsResult.status === "fulfilled") {
      setSessions(Array.isArray(sessionsResult.value) ? sessionsResult.value : [])
      setServicesError(false)
    } else {
      setSessions([])
      setServicesError(true)
    }
    setLoading(false)
  }, [t])

  useEffect(() => { void load() }, [load])

  const today = todayKey()
  const upcoming = useMemo(() => upcomingEvents(events, today), [events, today])
  const schedule = useMemo(() => serviceSchedule(sessions, today, locale), [sessions, today, locale])

  const servicesView = servicesError
    ? <ErrorState message={t("mobile.member.home.servicesError")} onRetry={() => void load()} />
    : schedule.length === 0
      ? <EmptyState message={t("mobile.member.home.noServices")} />
      : <View style={{ gap: spacing.md }}>
          <Text style={sectionTitle}>{copy(locale, { en: "Service schedule", sw: "Ratiba ya huduma" })}</Text>
          {schedule.map((service) => <ServiceRow key={service.id} service={service} />)}
        </View>

  const eventsView = eventsError
    ? <ErrorState message={eventsError} onRetry={() => void load()} />
    : upcoming.length === 0
      ? <EmptyState message={t("mobile.member.events.empty")} />
      : <View style={{ gap: spacing.md }}>
          <Text style={sectionTitle}>{copy(locale, { en: "Upcoming events", sw: "Matukio yajayo" })}</Text>
          {upcoming.map((event) => <EventCard key={event.id} event={event} rsvp={rsvps[event.id] ?? null} onPress={() => router.push(`/(member)/events/${event.id}`)} />)}
        </View>

  return <ScrollView contentContainerStyle={[styles.content, { backgroundColor: colors.canvas, padding: spacing.lg, gap: spacing.lg }]}>
    <SegmentedControl<Tab>
      segments={[
        { key: "services", label: copy(locale, { en: "Services", sw: "Huduma" }) },
        { key: "events", label: t("mobile.member.tabs.events") },
      ]}
      value={tab}
      onChange={setTab}
    />
    {loading ? <LoadingState /> : tab === "services" ? servicesView : eventsView}
  </ScrollView>
}

const sectionTitle = { ...type.h3, color: colors.ink }
