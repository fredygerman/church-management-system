import { useRef, useState } from "react"
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from "react-native"
import { useT } from "../../lib/locale"
import { styles as screenStyles } from "../screen-state"
import { Avatar, Button, ListRow, Sheet } from "../ui"
import { colors, spacing, type } from "../../theme"
import { messageKeyFor, removeAvatar, uploadAvatar } from "./avatar-api"
import { pickAvatar, type AvatarSource, type PickOutcome } from "./avatar-picker"

export type AvatarEditorProps = {
  name: string
  avatarUrl: string | null
  onChange: (avatarUrl: string | null) => void
  /** "dark" for use on a brand-coloured card. */
  tone?: "light" | "dark"
}

type Feedback = { kind: "error" | "success"; text: string }

// The photo, the choose / take / remove sheet, and the busy and feedback states.
// Upload and removal update the parent through onChange; a failure keeps the previous photo.
export function AvatarEditor({ name, avatarUrl, onChange, tone = "light" }: AvatarEditorProps) {
  const { t } = useT()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [settingsSource, setSettingsSource] = useState<AvatarSource | null>(null)
  // A ref, not state, so a second tap in the same frame cannot start another request.
  const inFlight = useRef(false)
  const onDark = tone === "dark"

  function begin(): boolean {
    if (inFlight.current) return false
    inFlight.current = true
    setBusy(true)
    setFeedback(null)
    setSettingsSource(null)
    return true
  }

  function end() {
    inFlight.current = false
    setBusy(false)
  }

  async function chooseFrom(source: AvatarSource) {
    setSheetOpen(false)
    let outcome: PickOutcome
    try {
      outcome = await pickAvatar(source)
    } catch {
      setFeedback({ kind: "error", text: t("profile.avatar.uploadFailed") })
      return
    }
    if (outcome.kind === "cancelled") return
    if (outcome.kind === "denied") {
      setSettingsSource(source)
      setFeedback({ kind: "error", text: t(source === "camera" ? "profile.avatar.cameraDenied" : "profile.avatar.libraryDenied") })
      return
    }
    if (!begin()) return
    try {
      const saved = await uploadAvatar(outcome.asset)
      onChange(saved.avatarUrl)
      setFeedback({ kind: "success", text: t("profile.avatar.updated") })
    } catch (error) {
      setFeedback({ kind: "error", text: t(messageKeyFor(error, "upload")) })
    } finally {
      end()
    }
  }

  async function remove() {
    setSheetOpen(false)
    if (!begin()) return
    try {
      await removeAvatar()
      onChange(null)
      setFeedback({ kind: "success", text: t("profile.avatar.removed") })
    } catch (error) {
      setFeedback({ kind: "error", text: t(messageKeyFor(error, "remove")) })
    } finally {
      end()
    }
  }

  const bodyColor = onDark ? "#E0E7FF" : colors.muted

  return <View style={styles.column}>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("profile.avatar.change")}
      accessibilityState={{ busy, disabled: busy }}
      disabled={busy}
      onPress={() => setSheetOpen(true)}
      style={({ pressed }) => [styles.tap, pressed && { opacity: 0.8 }]}
    >
      <Avatar uri={avatarUrl} name={name} size="lg" />
      {busy ? <View style={styles.busy}><ActivityIndicator color="#FFFFFF" /></View> : null}
    </Pressable>

    <Text style={[styles.hint, { color: bodyColor }]}>{busy ? t("profile.avatar.uploading") : t("profile.avatar.hint")}</Text>

    {feedback ? <Text accessibilityLiveRegion="polite" style={[feedback.kind === "error" ? screenStyles.error : screenStyles.success, onDark && { color: "#FFFFFF", textAlign: "center" }]}>{feedback.text}</Text> : null}

    {settingsSource ? <Button variant="secondary" title={t("profile.avatar.openSettings")} onPress={() => void Linking.openSettings()} /> : null}

    <Sheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title={t("profile.avatar.sheetTitle")} closeLabel={t("profile.avatar.close")}>
      <ListRow icon="images-outline" title={t("profile.avatar.chooseLibrary")} onPress={() => void chooseFrom("library")} />
      <ListRow icon="camera-outline" title={t("profile.avatar.takePhoto")} onPress={() => void chooseFrom("camera")} />
      {avatarUrl ? <ListRow icon="trash-outline" title={t("profile.avatar.remove")} onPress={() => void remove()} /> : null}
      <ListRow icon="close-outline" title={t("common.cancel")} onPress={() => setSheetOpen(false)} />
    </Sheet>
  </View>
}

const styles = StyleSheet.create({
  column: { alignItems: "center", alignSelf: "stretch", gap: spacing.sm },
  tap: { borderRadius: 999, overflow: "hidden" },
  busy: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0, 0, 0, 0.35)" },
  hint: { ...type.supporting, textAlign: "center" },
})
