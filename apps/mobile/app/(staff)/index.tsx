import { useCallback, useEffect, useState } from "react"
import { ScrollView, Text, View } from "react-native"
import { ApiError, api } from "../../lib/api"
import { useT } from "../../lib/locale"
import { ErrorState, LoadingState, styles } from "../../components/screen-state"

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
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t("mobile.staff.dashboard.title")}</Text>
      <View style={styles.card}>
        <Text style={styles.heading}>{stats.totalMembers}</Text>
        <Text style={styles.text}>{t("mobile.staff.dashboard.activeMembers")}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.heading}>{stats.activeZones}</Text>
        <Text style={styles.text}>{t("mobile.staff.dashboard.activeZones")}</Text>
      </View>
      {stats.pendingVisitors !== undefined ? (
        <View style={styles.card}>
          <Text style={styles.heading}>{stats.pendingVisitors}</Text>
          <Text style={styles.text}>{t("mobile.staff.dashboard.pendingVisitors")}</Text>
        </View>
      ) : null}
    </ScrollView>
  )
}
