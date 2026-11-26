import { useCallback, useEffect, useState } from "react"
import { ScrollView, Text, View } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { Button, Card, Pill } from "../../../components/ui"
import { colors, radii, spacing, type } from "../../../theme"
import { ApiError, api } from "../../../lib/api"
import { useT } from "../../../lib/locale"
import { ErrorState, LoadingState, styles } from "../../../components/screen-state"
import { DateBlock } from "../../../components/events/date-block"
import { RSVP_LABEL_KEYS } from "../../../components/events/event-card"
import { copy, dayOfMonth, formatEventDay, formatTimeRange, monthAbbrev } from "../../../components/events/format"
import { normalizeEvent, toRsvpStatus, type EventRecord, type RsvpStatus } from "../../../components/events/model"

function apiMessage(error: unknown, fallback: string) { return error instanceof ApiError ? error.message : fallback }

export default function EventDetailScreen() {
  const { t, locale } = useT()
  const { id } = useLocalSearchParams<{ id: string }>()
  const eventId = Array.isArray(id) ? id[0] : id
  const [event, setEvent] = useState<EventRecord | null>(null)
  const [currentRsvp, setCurrentRsvp] = useState<RsvpStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [submitError, setSubmitError] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [retryStatus, setRetryStatus] = useState<RsvpStatus | null>(null)

  const load = useCallback(async () => {
    if (!eventId) { setError(t("mobile.member.events.detail.unavailable")); setLoading(false); return }
    setLoading(true); setError("")
    try {
      const [eventResult, rsvpResult] = await Promise.allSettled([api.get<Record<string, unknown>>(`/events/${eventId}`), api.get<Record<string, unknown>[]>("/events/me")])
      if (eventResult.status === "rejected") throw eventResult.reason
      setEvent(normalizeEvent(eventResult.value))
      const rsvpData = rsvpResult.status === "fulfilled" ? rsvpResult.value : []
      const matching = Array.isArray(rsvpData) ? rsvpData.find((item) => item.eventId === eventId) : undefined
      setCurrentRsvp(toRsvpStatus(matching?.status))
    } catch (caught) { setError(apiMessage(caught, t("mobile.member.events.detail.loadError"))) }
    finally { setLoading(false) }
  }, [eventId, t])

  useEffect(() => { void load() }, [load])

  async function submit(status: RsvpStatus) {
    if (!eventId) return
    setSubmitting(true); setSubmitError(""); setConfirmation(""); setRetryStatus(null)
    try {
      const result = await api.put<{ message?: string }>(`/events/${eventId}/rsvp`, { status })
      setCurrentRsvp(status); setConfirmation(result?.message || t("mobile.member.events.rsvp.saved"))
    } catch (caught) { setRetryStatus(status); setSubmitError(apiMessage(caught, t("mobile.member.events.rsvp.saveError"))) }
    finally { setSubmitting(false) }
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />
  if (!event) return <ErrorState message={t("mobile.member.events.detail.unavailable")} onRetry={() => void load()} />

  const title = event.title || t("mobile.member.events.fallbackTitle")
  const when = `${formatEventDay(event.startsAt, locale)} · ${formatTimeRange(event.startsAt, event.endsAt)}`

  return <ScrollView contentContainerStyle={[styles.content, { backgroundColor: colors.canvas, padding: spacing.lg, gap: spacing.md }]}>
    <View style={hero.panel}>
      <View style={hero.top}>
        <DateBlock inverse size={64} month={monthAbbrev(event.startsAt, locale)} day={dayOfMonth(event.startsAt)} />
        {currentRsvp ? <Pill label={t(RSVP_LABEL_KEYS[currentRsvp])} tone={currentRsvp === "going" ? "success" : currentRsvp === "maybe" ? "accent" : "default"} /> : null}
      </View>
      <Text accessibilityRole="header" style={hero.title}>{title}</Text>
      <View style={hero.meta}><Ionicons name="time-outline" size={16} color={colors.surface} /><Text style={hero.metaText}>{when}</Text></View>
      {event.location ? <View style={hero.meta}><Ionicons name="location-outline" size={16} color={colors.surface} /><Text style={hero.metaText}>{event.location}</Text></View> : null}
    </View>

    {event.description ? <Card style={{ gap: spacing.sm }}>
      <Text style={{ ...type.h3, color: colors.ink }}>{copy(locale, { en: "About", sw: "Kuhusu tukio" })}</Text>
      <Text style={{ ...type.body, color: colors.ink }}>{event.description}</Text>
    </Card> : null}

    <Card style={{ gap: spacing.md }}>
      <Text style={{ ...type.h3, color: colors.ink }}>{t("mobile.member.events.rsvp.heading")}</Text>
      {currentRsvp ? <View accessibilityLiveRegion="polite" style={rsvpStyles.confirmed}>
        <Ionicons name="checkmark-circle" size={22} color={colors.success} />
        <Text style={rsvpStyles.confirmedText}>{t("mobile.member.events.rsvp.current", { response: t(RSVP_LABEL_KEYS[currentRsvp]) })}</Text>
      </View> : <Text style={{ ...type.supporting, color: colors.muted }}>{copy(locale, { en: "You have not responded yet.", sw: "Bado hujajibu." })}</Text>}
      {confirmation ? <Text accessibilityLiveRegion="polite" style={styles.success}>{confirmation}</Text> : null}
      {submitError ? <Text accessibilityLiveRegion="polite" style={styles.error}>{submitError}</Text> : null}
      {retryStatus ? <Button disabled={submitting} title={t("common.retry")} onPress={() => void submit(retryStatus)} variant="secondary" /> : null}
      <View style={{ gap: spacing.sm }}>
        <Button
          disabled={submitting}
          loading={submitting}
          icon={currentRsvp === "going" && !submitting ? "checkmark" : undefined}
          title={submitting ? t("common.saving") : t(RSVP_LABEL_KEYS.going)}
          onPress={() => void submit("going")}
        />
        <Button disabled={submitting} title={t(RSVP_LABEL_KEYS.maybe)} onPress={() => void submit("maybe")} variant="secondary" />
        <Button disabled={submitting} title={t(RSVP_LABEL_KEYS.declined)} onPress={() => void submit("declined")} variant="ghost" />
      </View>
    </Card>
  </ScrollView>
}

const hero = {
  panel: { backgroundColor: colors.brand, borderRadius: radii.panel, padding: spacing.lg, gap: spacing.sm },
  top: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, marginBottom: spacing.xs },
  title: { ...type.h1, color: colors.surface },
  meta: { flexDirection: "row" as const, alignItems: "center" as const, gap: spacing.sm },
  metaText: { ...type.supporting, color: colors.surface, flexShrink: 1 },
}

const rsvpStyles = {
  confirmed: { flexDirection: "row" as const, alignItems: "center" as const, gap: spacing.sm, padding: spacing.md, borderRadius: radii.card, backgroundColor: "#DCFCE7" },
  confirmedText: { ...type.body, color: colors.success, fontWeight: "600" as const, flexShrink: 1 },
}
