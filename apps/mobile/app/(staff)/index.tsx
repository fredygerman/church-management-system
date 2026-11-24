import { useCallback, useEffect, useState } from "react"
import { ScrollView, Text, View } from "react-native"
import { ApiError, api } from "../../lib/api"
import { ErrorState, LoadingState, styles } from "../../components/screen-state"

// Permission: read:member (GET /dashboard/stats). Only the fields with a verified source are shown.
type DashboardStats = { totalMembers: number; activeZones: number }

export default function DashboardScreen() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setStats(await api.get<DashboardStats>("/dashboard/stats"))
      setError("")
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to load the dashboard.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  if (loading) return <LoadingState />
  if (error || !stats) return <ErrorState message={error || "The dashboard is unavailable."} onRetry={() => void load()} />

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Dashboard</Text>
      <View style={styles.card}>
        <Text style={styles.heading}>{stats.totalMembers}</Text>
        <Text style={styles.text}>Active members</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.heading}>{stats.activeZones}</Text>
        <Text style={styles.text}>Active zones</Text>
      </View>
    </ScrollView>
  )
}
