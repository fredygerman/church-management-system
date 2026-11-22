import { useCallback, useEffect, useState } from "react"
import { Button, Text, View } from "react-native"
import { router } from "expo-router"
import { ApiError, api } from "../../lib/api"
import { useSession } from "../../lib/session"
import { EmptyState, ErrorState, LoadingState, styles } from "../../components/screen-state"

export default function HomeScreen() {
  const { user } = useSession()
  const [member, setMember] = useState<Record<string, unknown> | null>(null)
  const [announcements, setAnnouncements] = useState<Record<string, unknown>[]>([])
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [error, setError] = useState("")
  const load = useCallback(async () => {
    setStatus("loading")
    try {
      const [memberData, announcementData] = await Promise.all([api.get<Record<string, unknown> | null>("/members/me"), api.get<Record<string, unknown>[]>("/communications/announcements")])
      setMember(memberData)
      setAnnouncements(Array.isArray(announcementData) ? announcementData : [])
      setStatus("ready")
    } catch (caught) { setError(caught instanceof ApiError ? caught.message : "Unable to load home."); setStatus("error") }
  }, [])
  useEffect(() => { void load() }, [load])
  if (status === "loading") return <LoadingState />
  if (status === "error") return <ErrorState message={error} onRetry={() => void load()} />
  const name = typeof user?.name === "string" ? user.name : typeof member?.name === "string" ? member.name : "there"
  return <View style={styles.content}><Text style={styles.title}>Welcome, {name}</Text><Text style={styles.text}>Here are the latest updates from your church.</Text><Button title="Send a prayer request" onPress={() => router.push("/(member)/prayer")} /><Text style={styles.heading}>Recent announcements</Text>{announcements.length ? announcements.map((item, index) => <View key={String(item.id ?? index)}><Text style={styles.heading}>{typeof item.title === "string" ? item.title : "Announcement"}</Text>{typeof item.content === "string" ? <Text style={styles.text}>{item.content}</Text> : null}</View>) : <EmptyState message="There are no recent announcements." />}</View>
}

// TODO: Have fluent reviewers provide Swahili copy before localization.
