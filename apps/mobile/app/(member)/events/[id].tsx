import { useCallback, useEffect, useMemo, useState } from "react"
import { ScrollView, Text, View } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { Button, Card, Pill } from "../../../components/ui"
import { colors, spacing, type } from "../../../theme"
import { ApiError, api } from "../../../lib/api"
import { useT } from "../../../lib/locale"
import { ErrorState, LoadingState, styles } from "../../../components/screen-state"

type EventRecord = Record<string, unknown>
type RsvpStatus = "going" | "maybe" | "declined"

const RSVP_LABEL_KEYS = {
  going: "mobile.member.events.rsvp.going",
  maybe: "mobile.member.events.rsvp.maybe",
  declined: "mobile.member.events.rsvp.declined",
} as const

function apiMessage(error: unknown, fallback: string) { return error instanceof ApiError ? error.message : fallback }

export default function EventDetailScreen() {
  const { t } = useT()
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
      const [eventResult, rsvpResult] = await Promise.allSettled([api.get<EventRecord>(`/events/${eventId}`), api.get<EventRecord[]>("/events/me")])
      if (eventResult.status === "rejected") throw eventResult.reason
      setEvent(eventResult.value)
      const rsvpData = rsvpResult.status === "fulfilled" ? rsvpResult.value : []
      const matching = Array.isArray(rsvpData) ? rsvpData.find((item) => item.eventId === eventId || (item.event as EventRecord | null)?.id === eventId) : undefined
      const status = matching?.status
      setCurrentRsvp(status === "going" || status === "maybe" || status === "declined" ? status : null)
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

  const fields = useMemo(() => event ? [
    [t("mobile.member.events.detail.startsLabel"), typeof event.startsAt === "string" ? event.startsAt : null],
    [t("mobile.member.events.detail.endsLabel"), typeof event.endsAt === "string" ? event.endsAt : null],
    [t("mobile.member.events.detail.locationLabel"), typeof event.location === "string" ? event.location : null],
  ] as const : [], [event, t])

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />
  if (!event) return <ErrorState message={t("mobile.member.events.detail.unavailable")} onRetry={() => void load()} />
  return <ScrollView contentContainerStyle={[styles.content, { backgroundColor: colors.canvas, padding: spacing.lg }]}>
    <Card style={{ gap: spacing.md }}>
      <Pill label={t("mobile.member.events.rsvp.heading")} tone="accent" />
      <Text style={{ ...type.h1, color: colors.ink }}>{typeof event.title === "string" ? event.title : t("mobile.member.events.fallbackTitle")}</Text>
      {typeof event.description === "string" ? <Text style={styles.text}>{event.description}</Text> : null}
      {fields.map(([label, value]) => value ? <Text key={label} style={styles.text}>{label}: {value}</Text> : null)}
      {currentRsvp ? <Text style={styles.text}>{t("mobile.member.events.rsvp.current", { response: t(RSVP_LABEL_KEYS[currentRsvp]) })}</Text> : null}
      {confirmation ? <Text accessibilityLiveRegion="polite" style={styles.success}>{confirmation}</Text> : null}
      {submitError ? <Text accessibilityLiveRegion="polite" style={styles.error}>{submitError}</Text> : null}
      {retryStatus ? <Button disabled={submitting} title={t("common.retry")} onPress={() => void submit(retryStatus)} variant="secondary" /> : null}
      <View style={{ gap: spacing.sm }}>
        <Button disabled={submitting} loading={submitting} title={submitting ? t("common.saving") : t("mobile.member.events.rsvp.going")} onPress={() => void submit("going")} />
        <Button disabled={submitting} title={t("mobile.member.events.rsvp.maybe")} onPress={() => void submit("maybe")} variant="secondary" />
        <Button disabled={submitting} title={t("mobile.member.events.rsvp.declined")} onPress={() => void submit("declined")} variant="ghost" />
      </View>
    </Card>
  </ScrollView>
}
