import { useCallback, useEffect, useState } from "react"
import { Linking, Pressable, ScrollView, Text, TextInput, View } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { ApiError } from "../../lib/api"
import { useT } from "../../lib/locale"
import { libraryApi, type LibraryResource } from "../../lib/library-api"
import { ErrorState, LoadingState, styles } from "../../components/screen-state"

// Detail with a device-browser access action (DEC-15: no WebView) and a numeric position save.
export default function LibraryDetailScreen() {
  const { t } = useT()
  const { id } = useLocalSearchParams<{ id: string }>()
  const resourceId = typeof id === "string" ? id : ""
  const [resource, setResource] = useState<LibraryResource | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionError, setActionError] = useState("")
  const [opening, setOpening] = useState(false)
  const [position, setPosition] = useState("")
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [detail, current] = await Promise.all([libraryApi.detail(resourceId), libraryApi.progress(resourceId)])
      setResource(detail)
      setPosition(String(current.positionSeconds))
    } catch (caught) {
      setResource(null)
      if (caught instanceof ApiError && (caught.status === 403 || caught.status === 404)) {
        setError(t(caught.status === 403 ? "wiring.library.denied" : "wiring.library.notFound"))
      } else {
        setError(t("wiring.library.loadError"))
      }
    } finally {
      setLoading(false)
    }
  }, [resourceId, t])

  useEffect(() => { void load() }, [load])

  const openResource = useCallback(async () => {
    if (opening) return
    setOpening(true)
    setActionError("")
    try {
      const access = await libraryApi.access(resourceId)
      await Linking.openURL(access.url)
    } catch (caught) {
      const denied = caught instanceof ApiError && (caught.status === 403 || caught.status === 404)
      setActionError(t(denied ? "wiring.library.denied" : "wiring.library.accessError"))
    } finally {
      setOpening(false)
    }
  }, [opening, resourceId, t])

  const savePosition = useCallback(async () => {
    const seconds = Number(position)
    if (!Number.isInteger(seconds) || seconds < 0) {
      setSaveState("error")
      return
    }
    setSaveState("saving")
    try {
      await libraryApi.saveProgress(resourceId, { positionSeconds: seconds })
      setSaveState("saved")
    } catch {
      setSaveState("error")
    }
  }, [position, resourceId])

  if (loading) return <LoadingState />
  if (error || !resource) return <ErrorState message={error || t("wiring.library.loadError")} onRetry={() => void load()} />

  return <ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.heading}>{resource.title}</Text>
    {resource.description ? <Text style={styles.text}>{resource.description}</Text> : null}
    {resource.authorSpeaker ? <Text style={styles.text}>{resource.authorSpeaker}</Text> : null}
    <Text style={styles.text}>{t(`wiring.library.type.${resource.resourceType}`)}</Text>

    <Pressable accessibilityRole="button" accessibilityState={{ busy: opening }} disabled={opening} onPress={() => void openResource()} style={styles.card}>
      <Text style={styles.heading}>{opening ? t("wiring.library.opening") : t("wiring.library.open")}</Text>
    </Pressable>
    {actionError ? <Text accessibilityLiveRegion="polite" style={styles.error}>{actionError}</Text> : null}

    <View>
      <Text style={styles.formLabel}>{t("wiring.library.progressLabel")}</Text>
      <TextInput
        accessibilityLabel={t("wiring.library.progressLabel")}
        keyboardType="number-pad"
        onChangeText={(value) => { setPosition(value); setSaveState("idle") }}
        style={styles.input}
        value={position}
      />
      <Pressable accessibilityRole="button" disabled={saveState === "saving"} onPress={() => void savePosition()} style={styles.card}>
        <Text style={styles.heading}>{t("wiring.library.progressSave")}</Text>
      </Pressable>
      {saveState === "saved" ? <Text accessibilityLiveRegion="polite" style={styles.text}>{t("wiring.library.progressSaved")}</Text> : null}
      {saveState === "error" ? <Text accessibilityLiveRegion="polite" style={styles.error}>{t("wiring.library.progressError")}</Text> : null}
    </View>
  </ScrollView>
}
