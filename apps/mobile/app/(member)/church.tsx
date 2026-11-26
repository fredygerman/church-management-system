import { useEffect, useRef, useState } from "react"
import { ScrollView, Text, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Card, ListRow, SectionHeader } from "../../components/ui"
import { colors, spacing, type } from "../../theme"
import type { MessageKey } from "@church/config/i18n"
import { ApiError, api } from "../../lib/api"
import { useT } from "../../lib/locale"
import { createRequestGate } from "../../lib/request-gate"
import { useSession } from "../../lib/session"
import { ErrorState, LoadingState, styles } from "../../components/screen-state"

// Server messages are shown as the server sent them; our own messages are translated at render time.
type Failure = { text: string } | { key: MessageKey }

// Placeholder text seeded on some churches; it is not a real description, so the About card is hidden for it.
const PLACEHOLDER_DESCRIPTION = "Demo church data"

type ServiceSession = { id: string; title: string | null; sessionDate: string; serviceType?: { name?: string | null } | null }
type ServiceSummary = { day: number; name: string }

// Session dates are calendar dates (YYYY-MM-DD) with no clock time, so the weekday is read in UTC to avoid device-zone shifts.
function weekdayOf(date: string): number | null {
  const [year, month, day] = date.split("-").map(Number)
  if (!year || !month || !day) return null
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay()
}

// One line per weekday and service name, Sunday first, using the nearest upcoming session as the representative.
function summariseServices(sessions: ServiceSession[]): ServiceSummary[] {
  const seen = new Map<string, ServiceSummary>()
  const ordered = [...sessions].sort((a, b) => a.sessionDate.localeCompare(b.sessionDate))
  for (const session of ordered) {
    const day = weekdayOf(session.sessionDate)
    if (day === null) continue
    const name = session.serviceType?.name?.trim() || session.title?.trim() || ""
    const key = `${day}|${name}`
    if (!seen.has(key)) seen.set(key, { day, name })
  }
  return [...seen.values()].sort((a, b) => a.day - b.day).slice(0, 4)
}

// A view-drawn cross on a tint circle: the church mark without any photo.
function ChurchMark() {
  return <View accessible={false} style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.tint, alignItems: "center", justifyContent: "center" }}>
    <View style={{ position: "absolute", width: 6, height: 34, borderRadius: 3, backgroundColor: colors.brandStrong }} />
    <View style={{ position: "absolute", top: 24, width: 26, height: 6, borderRadius: 3, backgroundColor: colors.brandStrong }} />
  </View>
}

export default function ChurchScreen() {
  const { t, locale } = useT()
  const { user, contextKey } = useSession()
  const churchId = typeof user?.churchId === "string" ? user.churchId : null
  const gate = useRef(createRequestGate()).current
  const [church, setChurch] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<Failure | null>(null)
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  const [services, setServices] = useState<ServiceSummary[]>([])

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

  // Service times are optional: if this call fails or returns nothing usable, the card is simply hidden.
  useEffect(() => {
    let active = true
    setServices([])
    if (!churchId) return () => { active = false }
    api.get<ServiceSession[]>("/attendance/sessions").then(
      (sessions) => { if (active && Array.isArray(sessions)) setServices(summariseServices(sessions)) },
      () => { if (active) setServices([]) },
    )
    return () => { active = false }
  }, [churchId, contextKey])

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={"text" in error ? error.text : t(error.key)} onRetry={() => setAttempt((value) => value + 1)} />
  if (!church) return <ErrorState message={t("mobile.shared.church.unavailable")} onRetry={() => setAttempt((value) => value + 1)} />
  const name = typeof church.name === "string" ? church.name : t("mobile.shared.church.fallbackName")
  const location = typeof church.location === "string" ? church.location : undefined
  const description = typeof church.description === "string" ? church.description.trim() : ""
  const showAbout = description.length > 0 && description !== PLACEHOLDER_DESCRIPTION
  const pastor = typeof church.leadPastorName === "string" ? church.leadPastorName.trim() : ""
  const serviceLabel = (summary: ServiceSummary) => t(`mobile.member.church.day.${summary.day}` as MessageKey)

  return <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg, gap: spacing.md }]}>
    <Card style={{ alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xl }}>
      <ChurchMark />
      <Text accessibilityRole="header" style={{ ...type.h2, color: colors.ink, textAlign: "center", marginTop: spacing.sm }}>{name}</Text>
      {location ? <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
        <Ionicons name="location-outline" size={16} color={colors.muted} />
        <Text style={{ ...type.supporting, color: colors.muted, textAlign: "center" }}>{location}</Text>
      </View> : null}
    </Card>

    {showAbout ? <Card>
      <SectionHeader title={t("mobile.member.church.about")} />
      <Text style={{ ...type.body, color: colors.muted }}>{description}</Text>
    </Card> : null}

    {pastor ? <Card>
      <SectionHeader title={t("mobile.member.church.leadership")} />
      <ListRow icon="person-outline" title={pastor} subtitle={t("mobile.member.church.leadPastor")} trailing={<View />} />
    </Card> : null}

    {services.length > 0 ? <Card>
      <SectionHeader title={t("mobile.member.church.serviceTimes")} />
      {services.map((summary) => <ListRow
        key={`${summary.day}|${summary.name}`}
        icon="calendar-outline"
        title={serviceLabel(summary)}
        subtitle={summary.name || undefined}
        trailing={<View />}
      />)}
    </Card> : null}
  </ScrollView>
}
