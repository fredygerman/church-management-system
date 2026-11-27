import { useCallback, useEffect, useState } from "react"
import { ScrollView, Text, View } from "react-native"
import { ApiError, api } from "../../../lib/api"
import { useT } from "../../../lib/locale"
import { ErrorState, LoadingState, styles } from "../../../components/screen-state"
import { router } from "expo-router"
import { Button, Card, SectionHeader, Pill } from "../../../components/ui"
import { colors, spacing, type } from "../../../theme"
import { StyleSheet } from "react-native"

// Permission: read:member (GET /dashboard/stats). Only the fields with a verified source are shown.
// pendingVisitors is sent only to roles that can view visitors (DEC-01).
type DashboardStats = { totalMembers: number; activeZones: number; pendingVisitors?: number }

export default function DashboardScreen() {
  const { t } = useT()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setStats(await api.get<DashboardStats>("/dashboard/stats"))
      setError("")
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t("mobile.staff.dashboard.loadError"))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => { void load() }, [load])

  if (loading) return <LoadingState />
  if (error || !stats) return <ErrorState message={error || t("mobile.staff.dashboard.unavailable")} onRetry={() => void load()} />

  return (
    <ScrollView contentContainerStyle={dashboardStyles.content}>
      <Text style={styles.title}>{t("mobile.staff.dashboard.title")}</Text>
      <SectionHeader title={t("mobile.staff.dashboard.activeMembers")} />
      <View style={dashboardStyles.grid}>
      <Card style={dashboardStyles.stat}><Text style={dashboardStyles.value}>{stats.totalMembers}</Text><Pill label={t("mobile.staff.dashboard.activeMembers")} tone="success" /></Card>
      <Card style={dashboardStyles.stat}><Text style={dashboardStyles.value}>{stats.activeZones}</Text><Pill label={t("mobile.staff.dashboard.activeZones")} /></Card>
      {stats.pendingVisitors !== undefined ? (
        <Card style={dashboardStyles.stat}><Text style={dashboardStyles.value}>{stats.pendingVisitors}</Text><Pill label={t("mobile.staff.dashboard.pendingVisitors")} tone="warning" /></Card>
      ) : null}
      </View>
      <Button title={t("verses.title")} variant="secondary" icon="book-outline" onPress={() => router.push("/verses")} />
    </ScrollView>
  )
}

const dashboardStyles = StyleSheet.create({ content: { flexGrow: 1, backgroundColor: colors.canvas, padding: spacing.lg, gap: spacing.md }, grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md }, stat: { flexGrow: 1, flexBasis: "45%", minHeight: 112, justifyContent: "space-between" }, value: { ...type.h1, color: colors.ink } })
