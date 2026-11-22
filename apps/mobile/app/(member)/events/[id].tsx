import { useCallback, useEffect, useMemo, useState } from "react"
import { Button, ScrollView, Text, View } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { ApiError, api } from "../../../lib/api"
import { ErrorState, LoadingState, styles } from "../../../components/screen-state"

type EventRecord = Record<string, unknown>
type RsvpStatus = "going" | "maybe" | "declined"

function apiMessage(error: unknown, fallback: string) { return error instanceof ApiError ? error.message : fallback }

export default function EventDetailScreen() {
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
    if (!eventId) { setError("This event is unavailable."); setLoading(false); return }
    setLoading(true); setError("")
    try {
      const [eventResult, rsvpResult] = await Promise.allSettled([api.get<EventRecord>(`/events/${eventId}`), api.get<EventRecord[]>("/events/me")])
      if (eventResult.status === "rejected") throw eventResult.reason
      setEvent(eventResult.value)
      const rsvpData = rsvpResult.status === "fulfilled" ? rsvpResult.value : []
      const matching = Array.isArray(rsvpData) ? rsvpData.find((item) => item.eventId === eventId || (item.event as EventRecord | null)?.id === eventId) : undefined
      const status = matching?.status
      setCurrentRsvp(status === "going" || status === "maybe" || status === "declined" ? status : null)
    } catch (caught) { setError(apiMessage(caught, "Unable to load this event.")) }
    finally { setLoading(false) }
  }, [eventId])

  useEffect(() => { void load() }, [load])

  async function submit(status: RsvpStatus) {
    if (!eventId) return
    setSubmitting(true); setSubmitError(""); setConfirmation(""); setRetryStatus(null)
    try {
      const result = await api.put<{ message?: string }>(`/events/${eventId}/rsvp`, { status })
      setCurrentRsvp(status); setConfirmation(result?.message || "Your RSVP was saved.")
    } catch (caught) { setRetryStatus(status); setSubmitError(apiMessage(caught, "Unable to save your RSVP. Try again.")) }
    finally { setSubmitting(false) }
  }

  const fields = useMemo(() => event ? [
    ["When", typeof event.startsAt === "string" ? event.startsAt : null],
    ["Ends", typeof event.endsAt === "string" ? event.endsAt : null],
    ["Location", typeof event.location === "string" ? event.location : null],
  ] as const : [], [event])

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />
  if (!event) return <ErrorState message="This event is unavailable." onRetry={() => void load()} />
  return <ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.title}>{typeof event.title === "string" ? event.title : "Event"}</Text>
    {typeof event.description === "string" ? <Text style={styles.text}>{event.description}</Text> : null}
    {fields.map(([label, value]) => value ? <Text key={label} style={styles.text}>{label}: {value}</Text> : null)}
    <Text style={styles.heading}>Your RSVP</Text>
    {currentRsvp ? <Text style={styles.text}>Current response: {currentRsvp}</Text> : null}
    {confirmation ? <Text accessibilityLiveRegion="polite" style={styles.success}>{confirmation}</Text> : null}
    {submitError ? <Text accessibilityLiveRegion="polite" style={styles.error}>{submitError}</Text> : null}
    {retryStatus ? <Button disabled={submitting} title="Try again" onPress={() => void submit(retryStatus)} /> : null}
    <View style={styles.card}>
      <Button disabled={submitting} title={submitting ? "Saving…" : "Going"} onPress={() => void submit("going")} />
      <Button disabled={submitting} title="Maybe" onPress={() => void submit("maybe")} />
      <Button disabled={submitting} title="Can't go" onPress={() => void submit("declined")} />
    </View>
    {/* TODO: Have fluent reviewers provide Swahili copy before localization. */}
  </ScrollView>
}
