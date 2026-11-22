import { useCallback, useEffect, useState } from "react"
import { Button, Text, View } from "react-native"
import { ApiError, api } from "../../lib/api"
import { useSession } from "../../lib/session"
import { ErrorState, LoadingState, styles } from "../../components/screen-state"

export default function ProfileScreen() {
  const { signOut } = useSession(); const [profile, setProfile] = useState<Record<string, unknown> | null>(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(true)
  const load = useCallback(async () => { setLoading(true); try { setProfile(await api.get<Record<string, unknown>>("/users/me")); setError("") } catch (caught) { setError(caught instanceof ApiError ? caught.message : "Unable to load your profile.") } finally { setLoading(false) } }, [])
  useEffect(() => { void load() }, [load])
  if (loading) return <LoadingState />; if (error) return <ErrorState message={error} onRetry={() => void load()} />; if (!profile) return <ErrorState message="Profile is unavailable." onRetry={() => void load()} />
  return <View style={styles.content}><Text style={styles.title}>{typeof profile.name === "string" ? profile.name : "Profile"}</Text>{typeof profile.email === "string" ? <Text style={styles.text}>{profile.email}</Text> : null}{typeof profile.role === "string" ? <Text style={styles.text}>{profile.role}</Text> : null}<Button title="Sign out" onPress={() => void signOut()} /></View>
}
