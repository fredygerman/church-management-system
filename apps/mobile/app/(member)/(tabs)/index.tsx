import { useEffect, useMemo, useRef, useState } from "react"
import { ScrollView, StyleSheet, View } from "react-native"
import { router } from "expo-router"
import { ApiError, api } from "../../../lib/api"
import { useSession } from "../../../lib/session"
import { useT } from "../../../lib/locale"
import { createRequestGate } from "../../../lib/request-gate"
import { EmptyState, ErrorState, LoadingState } from "../../../components/screen-state"
import { Card, SectionHeader } from "../../../components/ui"
import { HomeHero } from "../../../components/home/home-hero"
import { HomeAction } from "../../../components/home/home-action"
import { VerseOfTheDay } from "../../../components/verses/verse-of-the-day"
import { AnnouncementCard, UpcomingCard, type AnnouncementItem, type UpcomingItem } from "../../../components/home/home-cards"
import { darDayIndex, darMidnightFromDateOnly } from "../../../components/home/dar-time"
import { colors, shadow, spacing } from "../../../theme"

type ServiceSession = {
  id: string
  title: string | null
  sessionDate: string
  status: string
  serviceType: { id: string; name: string } | null
}

type EventItem = { id?: string; title?: string | null; startsAt?: string | null; location?: string | null }

/** Strips markup and collapses whitespace so API bodies read as plain text. */
function plainText(value: unknown): string {
  if (typeof value !== "string") return ""
  return value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim()
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    const text = plainText(value)
    if (text) return text
  }
  return ""
}

function validDate(value: unknown): Date | null {
  if (typeof value !== "string") return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export default function HomeScreen() {
  const { user, contextKey, isStaff, setSpace } = useSession()
  const { t, locale } = useT()
  const [member, setMember] = useState<Record<string, unknown> | null>(null)
  const [announcements, setAnnouncements] = useState<Record<string, unknown>[]>([])
  const [churchName, setChurchName] = useState<string | null>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)
  const loadGate = useRef(createRequestGate()).current
  // Separate from the profile load: a services or events failure should not hide the announcements.
  const [services, setServices] = useState<ServiceSession[]>([])
  const [events, setEvents] = useState<EventItem[]>([])
  const [servicesStatus, setServicesStatus] = useState<"loading" | "ready" | "error">("loading")
  const [servicesAttempt, setServicesAttempt] = useState(0)
  const servicesGate = useRef(createRequestGate()).current

  useEffect(() => {
    const isCurrent = loadGate.start()
    // Rows from the previous church or role must not show while this context loads.
    setMember(null)
    setAnnouncements([])
    setChurchName(null)
    setStatus("loading")
    const churchId = typeof user?.churchId === "string" ? user.churchId : null
    // The church name is display-only; a failure just falls back to a generic label.
    const church = churchId ? api.get<Record<string, unknown> | null>(`/churches/${churchId}`).catch(() => null) : Promise.resolve(null)
    Promise.all([api.get<Record<string, unknown> | null>("/members/me"), api.get<{ items?: Record<string, unknown>[] }>("/announcements"), church]).then(
      ([memberData, announcementData, churchData]) => {
        if (!isCurrent()) return
        setMember(memberData)
        setAnnouncements(Array.isArray(announcementData?.items) ? announcementData.items : [])
        setChurchName(typeof churchData?.name === "string" && churchData.name.trim() ? churchData.name.trim() : null)
        setStatus("ready")
      },
      (caught: unknown) => {
        if (!isCurrent()) return
        setError(caught instanceof ApiError ? caught.message : t("mobile.member.home.loadError"))
        setStatus("error")
      },
    )
    return () => loadGate.invalidate()
    // user?.churchId changes with contextKey, so contextKey is the reload trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextKey, attempt, t, loadGate])

  useEffect(() => {
    const isCurrent = servicesGate.start()
    setServices([])
    setEvents([])
    setServicesStatus("loading")
    Promise.all([
      api.get<ServiceSession[]>("/attendance/sessions").catch(() => null),
      api.get<EventItem[]>("/events").catch(() => null),
    ]).then(([sessions, eventData]) => {
      if (!isCurrent()) return
      if (sessions === null && eventData === null) {
        setServicesStatus("error")
        return
      }
      setServices(Array.isArray(sessions) ? sessions : [])
      setEvents(Array.isArray(eventData) ? eventData : [])
      setServicesStatus("ready")
    })
    return () => servicesGate.invalidate()
  }, [contextKey, servicesAttempt, servicesGate])

  // Next service or event, earliest first. Dates are judged on Dar es Salaam calendar days.
  const upcoming = useMemo<UpcomingItem | null>(() => {
    const todayIndex = darDayIndex(new Date())
    const candidates: UpcomingItem[] = []
    for (const event of events) {
      const at = validDate(event.startsAt)
      if (!at || darDayIndex(at) < todayIndex) continue
      candidates.push({
        title: typeof event.title === "string" && event.title.trim() ? event.title : t("mobile.member.events.fallbackTitle"),
        place: typeof event.location === "string" && event.location.trim() ? event.location : churchName,
        at,
        showTime: true,
        route: event.id ? `/(member)/events/${event.id}` : "/(member)/events",
      })
    }
    for (const service of services) {
      const at = darMidnightFromDateOnly(service.sessionDate)
      if (Number.isNaN(at.getTime()) || darDayIndex(at) < todayIndex) continue
      candidates.push({
        title: service.title || service.serviceType?.name || t("mobile.member.home.serviceFallback"),
        place: churchName,
        at,
        showTime: false,
        route: "/(member)/events",
      })
    }
    candidates.sort((a, b) => a.at.getTime() - b.at.getTime())
    return candidates[0] ?? null
  }, [events, services, churchName, t])

  const announcementItems = useMemo<AnnouncementItem[]>(() => announcements.map((item, index) => ({
    id: String(item.id ?? index),
    title: firstText(item.title) || t("mobile.member.home.announcementFallback"),
    excerpt: firstText(item.summary),
    sentAt: validDate(item.publishedAt ?? item.createdAt),
  })), [announcements, t])

  if (status === "loading") return <LoadingState />
  if (status === "error") return <ErrorState message={error} onRetry={() => setAttempt((value) => value + 1)} />

  const fullName = typeof user?.name === "string" && user.name.trim() ? user.name.trim() : typeof member?.name === "string" && member.name.trim() ? member.name.trim() : ""
  const firstName = fullName ? fullName.split(/\s+/)[0] : t("mobile.member.home.guestName")
  const activeRole = typeof user?.activeRole === "string" && user.activeRole ? user.activeRole : "member"
  const roleLabel = activeRole === "member" ? t("mobile.member.home.roleMember") : activeRole.charAt(0).toUpperCase() + activeRole.slice(1)
  const displayChurch = churchName ?? t("mobile.member.home.churchFallback")
  const now = new Date()

  return <ScrollView style={homeStyles.screen} contentContainerStyle={homeStyles.content}>
    <HomeHero greeting={t("mobile.member.home.welcome", { name: firstName })} roleLine={`${roleLabel} · ${displayChurch}`} churchName={displayChurch} />
    <View style={homeStyles.body}>
    <View style={homeStyles.actionsWrap}>
      <View style={[homeStyles.actions, shadow]}>
        <HomeAction icon="heart-outline" label={t("mobile.member.home.prayerButton")} onPress={() => router.push("/(member)/prayer")} />
        <HomeAction icon="library-outline" label={t("wiring.home.libraryButton")} onPress={() => router.push("/(member)/library-catalog")} />
        <HomeAction icon="mail-outline" label={t("wiring.home.inboxButton")} onPress={() => router.push("/(member)/inbox")} />
        <HomeAction icon="calendar-outline" label={t("mobile.member.tabs.events")} onPress={() => router.push("/(member)/events")} />
        {isStaff ? <HomeAction icon="people-outline" label={t("wiring.spaces.toStaff")} onPress={() => setSpace("staff")} /> : null}
      </View>
    </View>
    {/* Verse of the day comes from the API. It renders nothing when the API has no text for the language (D-23). */}
    <VerseOfTheDay />
    <View>
      <SectionHeader title={t("mobile.member.home.upcomingHeading")} actionLabel={t("mobile.member.home.seeAll")} onAction={() => router.push("/(member)/events")} />
      {servicesStatus === "loading" ? <LoadingState /> : servicesStatus === "error" ? <ErrorState message={t("mobile.member.home.servicesError")} onRetry={() => setServicesAttempt((value) => value + 1)} /> : upcoming ? <UpcomingCard item={upcoming} locale={locale} onPress={() => router.push(upcoming.route as "/(member)/events")} /> : <Card><EmptyState message={t("mobile.member.home.noUpcoming")} /></Card>}
    </View>
    <View>
      <SectionHeader title={t("mobile.member.home.announcementsHeading")} />
      {announcementItems.length ? <View style={homeStyles.stack}>{announcementItems.map((item) => <AnnouncementCard key={item.id} item={item} locale={locale} now={now} t={t} />)}</View> : <Card><EmptyState message={t("mobile.member.home.noAnnouncements")} /></Card>}
    </View>
    </View>
  </ScrollView>
}

const homeStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingBottom: spacing.xxxl },
  body: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  // Pulls the card up over the hero's rounded bottom edge.
  actionsWrap: { marginTop: -48 },
  actions: { flexDirection: "row", justifyContent: "space-between", backgroundColor: colors.surface, borderRadius: 16, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: colors.border, elevation: 4 },
  stack: { gap: spacing.md },
})
