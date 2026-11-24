import { useCallback, useEffect, useState } from "react"
import { Alert, Button, Text, View } from "react-native"
import { ApiError, api } from "../lib/api"
import { useSession } from "../lib/session"
import { styles } from "./screen-state"

type Space = { churchId: string; churchName: string; role: string; status: string }

/** Lists the churches the user belongs to and switches the active one (GET /auth/memberships, POST /auth/switch-church). */
export function SpacesSection() {
  const { user, switchChurch } = useSession()
  const [spaces, setSpaces] = useState<Space[] | null>(null)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [switching, setSwitching] = useState(false)

  const load = useCallback(async () => {
    setError("")
    try {
      setSpaces(await api.get<Space[]>("/auth/memberships"))
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to load your spaces.")
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function doSwitch(space: Space) {
    setSwitching(true)
    setError("")
    setNotice("")
    try {
      await switchChurch(space.churchId)
      setNotice(`You are now in ${space.churchName}.`)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to switch spaces. Try again.")
    } finally {
      setSwitching(false)
    }
  }

  function confirmSwitch(space: Space) {
    Alert.alert(`Switch to ${space.churchName}?`, "Your screens will change to this space.", [
      { text: "Cancel", style: "cancel" },
      { text: "Switch", onPress: () => void doSwitch(space) },
    ])
  }

  if (!spaces) {
    return (
      <View style={styles.card}>
        <Text style={styles.heading}>Spaces</Text>
        {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : <Text style={styles.text}>Loading spaces…</Text>}
        {error ? <Button title="Try again" onPress={() => void load()} /> : null}
      </View>
    )
  }

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Spaces</Text>
      {spaces.map((space) => {
        const current = space.churchId === user?.activeChurchId
        return (
          <View key={space.churchId} style={{ marginBottom: 12 }}>
            <Text style={styles.text}>{space.churchName} · {space.role}{current ? " (current)" : ""}</Text>
            {current ? null : <Button disabled={switching} title={`Switch to ${space.churchName}`} onPress={() => confirmSwitch(space)} />}
          </View>
        )
      })}
      {notice ? <Text accessibilityLiveRegion="polite" style={styles.success}>{notice}</Text> : null}
      {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
    </View>
  )
}
