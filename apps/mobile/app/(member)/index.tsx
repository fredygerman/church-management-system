import { useEffect, useRef, useState } from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import { router } from "expo-router"
import { ApiError, api } from "../../lib/api"
import { useSession } from "../../lib/session"
import { useT } from "../../lib/locale"
import { createRequestGate } from "../../lib/request-gate"
import { formatLocaleDate, type Locale } from "@church/config/i18n"
import { EmptyState, ErrorState, LoadingState, styles } from "../../components/screen-state"
import { Card, HeroBanner, QuickAction, SectionHeader } from "../../components/ui"
import { colors, spacing, type } from "../../theme"

type ServiceSession = {
  id: string
  title: string | null
  sessionDate: string
  status: string
  serviceType: { id: string; name: string } | null
}

function formatServiceDate(sessionDate: string, locale: Locale) {
  // Plain YYYY-MM-DD dates: parse as local midnight so the day does not shift.
  const date = new Date(`${sessionDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return sessionDate
  return formatLocaleDate(date, locale, { weekday: "short", month: "short", day: "numeric" })
}

export default function HomeScreen() {
  const { user, contextKey, isStaff, setSpace } = useSession()
  const { t, locale } = useT()
  const [member, setMember] = useState<Record<string, unknown> | null>(null)
  const [announcements, setAnnouncements] = useState<Record<string, unknown>[]>([])
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)
  const loadGate = useRef(createRequestGate()).current
  // Separate from the profile load: a services failure should not hide the announcements.
  const [services, setServices] = useState<ServiceSession[]>([])
  const [servicesStatus, setServicesStatus] = useState<"loading" | "ready" | "error">("loading")
  const [servicesAttempt, setServicesAttempt] = useState(0)
  const servicesGate = useRef(createRequestGate()).current

  useEffect(() => {
    const isCurrent = loadGate.start()
    // Rows from the previous church or role must not show while this context loads.
    setMember(null)
    setAnnouncements([])
    setStatus("loading")
    Promise.all([api.get<Record<string, unknown> | null>("/members/me"), api.get<Record<string, unknown>[]>("/communications/announcements")]).then(
      ([memberData, announcementData]) => {
        if (!isCurrent()) return
        setMember(memberData)
        setAnnouncements(Array.isArray(announcementData) ? announcementData : [])
        setStatus("ready")
      },
      (caught: unknown) => {
        if (!isCurrent()) return
        setError(caught instanceof ApiError ? caught.message : t("mobile.member.home.loadError"))
        setStatus("error")
      },
    )
    return () => loadGate.invalidate()
  }, [contextKey, attempt, t, loadGate])

  useEffect(() => {
    const isCurrent = servicesGate.start()
    setServices([])
    setServicesStatus("loading")
    api.get<ServiceSession[]>("/attendance/sessions").then(
      (sessions) => {
        if (!isCurrent()) return
        setServices(Array.isArray(sessions) ? sessions.slice(0, 3) : [])
        setServicesStatus("ready")
      },
      () => { if (isCurrent()) setServicesStatus("error") },
    )
    return () => servicesGate.invalidate()
  }, [contextKey, servicesAttempt, servicesGate])

  if (status === "loading") return <LoadingState />
  if (status === "error") return <ErrorState message={error} onRetry={() => setAttempt((value) => value + 1)} />
  const name = typeof user?.name === "string" ? user.name : typeof member?.name === "string" ? member.name : t("mobile.member.home.guestName")
  return <ScrollView style={homeStyles.screen} contentContainerStyle={homeStyles.content}>
    <HeroBanner title={t("mobile.member.home.welcome", { name })} subtitle={t("mobile.member.home.intro")} />
    <View style={homeStyles.actions}>
      <QuickAction icon="heart-outline" label={t("mobile.member.home.prayerButton")} onPress={() => router.push("/(member)/prayer")} />
      <QuickAction icon="library-outline" label={t("wiring.home.libraryButton")} onPress={() => router.push("/(member)/library-catalog")} />
      <QuickAction icon="mail-outline" label={t("wiring.home.inboxButton")} onPress={() => router.push("/(member)/inbox")} />
      {isStaff ? <QuickAction icon="people-outline" label={t("wiring.spaces.toStaff")} onPress={() => setSpace("staff")} /> : null}
    </View>
    <Card><SectionHeader title={t("mobile.member.home.servicesHeading")} />
      {servicesStatus === "loading" ? <LoadingState /> : servicesStatus === "error" ? <ErrorState message={t("mobile.member.home.servicesError")} onRetry={() => setServicesAttempt((value) => value + 1)} /> : services.length ? services.map((service) => <View key={service.id} style={homeStyles.item}><Text style={homeStyles.itemTitle}>{service.title || service.serviceType?.name || t("mobile.member.home.serviceFallback")}</Text><Text style={homeStyles.meta}>{formatServiceDate(service.sessionDate, locale)}</Text></View>) : <EmptyState message={t("mobile.member.home.noServices")} />}
    </Card>
    <Card><SectionHeader title={t("mobile.member.home.announcementsHeading")} />
      {announcements.length ? announcements.map((item, index) => <View key={String(item.id ?? index)} style={homeStyles.item}><Text style={homeStyles.itemTitle}>{typeof item.title === "string" ? item.title : t("mobile.member.home.announcementFallback")}</Text>{typeof item.content === "string" ? <Text style={homeStyles.meta}>{item.content}</Text> : null}</View>) : <EmptyState message={t("mobile.member.home.noAnnouncements")} />}
    </Card>
  </ScrollView>
}

const homeStyles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.canvas }, content: { padding: spacing.lg, gap: spacing.lg }, actions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", backgroundColor: colors.surface, borderRadius: 12 }, item: { paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.xs }, itemTitle: { ...type.body, color: colors.ink, fontWeight: "600" }, meta: { ...type.supporting, color: colors.muted } })
