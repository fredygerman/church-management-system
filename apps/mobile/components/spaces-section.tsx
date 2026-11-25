import { useCallback, useEffect, useState } from "react"
import { Alert, Button, Text, View } from "react-native"
import { dictionaries, type MessageKey } from "@church/config"
import { ApiError, api } from "../lib/api"
import { useT } from "../lib/locale"
import { useSession } from "../lib/session"
import { styles } from "./screen-state"

type Space = { churchId: string; churchName: string; role: string; status: string }

// Server messages are shown as the server sent them; our own messages are translated at render time.
type Failure = { text: string } | { key: MessageKey }

/** Lists the churches the user belongs to and switches the active one (GET /auth/memberships, POST /auth/switch-church). */
export function SpacesSection() {
  const { t } = useT()
  const { user, switchChurch } = useSession()
  const [spaces, setSpaces] = useState<Space[] | null>(null)
  const [error, setError] = useState<Failure | null>(null)
  const [notice, setNotice] = useState("")
  const [switching, setSwitching] = useState(false)
  const errorText = error ? ("text" in error ? error.text : t(error.key)) : ""

  const load = useCallback(async () => {
    setError(null)
    try {
      setSpaces(await api.get<Space[]>("/auth/memberships"))
    } catch (caught) {
      setError(caught instanceof ApiError ? { text: caught.message } : { key: "mobile.shared.spaces.loadError" })
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function doSwitch(space: Space) {
    setSwitching(true)
    setError(null)
    setNotice("")
    try {
      await switchChurch(space.churchId)
      setNotice(t("mobile.shared.spaces.switched", { churchName: space.churchName }))
    } catch (caught) {
      setError(caught instanceof ApiError ? { text: caught.message } : { key: "mobile.shared.spaces.switchError" })
    } finally {
      setSwitching(false)
    }
  }

  function confirmSwitch(space: Space) {
    Alert.alert(t("mobile.shared.spaces.confirmTitle", { churchName: space.churchName }), t("mobile.shared.spaces.confirmBody"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("mobile.shared.spaces.confirmAction"), onPress: () => void doSwitch(space) },
    ])
  }

  if (!spaces) {
    return (
      <View style={styles.card}>
        <Text style={styles.heading}>{t("mobile.shared.spaces.heading")}</Text>
        {errorText ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errorText}</Text> : <Text style={styles.text}>{t("mobile.shared.spaces.loading")}</Text>}
        {errorText ? <Button title={t("common.retry")} onPress={() => void load()} /> : null}
      </View>
    )
  }

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>{t("mobile.shared.spaces.heading")}</Text>
      {spaces.map((space) => {
        const current = space.churchId === user?.activeChurchId
        const roleKey = `mobile.shared.role.${space.role}`
        const roleText = roleKey in dictionaries.en ? t(roleKey as MessageKey) : space.role
        return (
          <View key={space.churchId} style={{ marginBottom: 12 }}>
            <Text style={styles.text}>{space.churchName} · {roleText}{current ? ` ${t("mobile.shared.spaces.current")}` : ""}</Text>
            {current ? null : <Button disabled={switching} title={t("mobile.shared.spaces.switchButton", { churchName: space.churchName })} onPress={() => confirmSwitch(space)} />}
          </View>
        )
      })}
      {notice ? <Text accessibilityLiveRegion="polite" style={styles.success}>{notice}</Text> : null}
      {errorText ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errorText}</Text> : null}
    </View>
  )
}
