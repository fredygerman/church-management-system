import { router, Stack } from "expo-router"
import { useState } from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import type { MessageKey } from "@church/config/i18n"
import { useT } from "../lib/locale"
import { Button, Card, TextField } from "../components/ui"
import { joinErrorKey, submitJoinCode } from "../components/church-switcher/church-api"
import { isValidJoinCode, JOIN_CODE_MAX_LENGTH, normalizeJoinCode } from "../components/church-switcher/join-code"
import { colors, spacing, type } from "../theme"

type Phase =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "pending_approval"; churchName?: string }
  | { status: "error"; messageKey: MessageKey }

/** Enter a church code to request membership. Joining never grants access: an admin approves the request. */
export default function JoinScreen() {
  const { t } = useT()
  const [code, setCode] = useState("")
  const [phase, setPhase] = useState<Phase>({ status: "idle" })
  const submitting = phase.status === "submitting"
  const canSubmit = isValidJoinCode(code) && !submitting

  async function submit() {
    if (!canSubmit) return
    setPhase({ status: "submitting" })
    try {
      const result = await submitJoinCode(code)
      setPhase({ status: "pending_approval", churchName: result.churchName })
    } catch (error) {
      setPhase({ status: "error", messageKey: joinErrorKey(error) })
    }
  }

  function leave() {
    if (router.canGoBack()) router.back()
    else router.replace("/(member)")
  }

  return (
    <>
      <Stack.Screen options={{ title: t("join.title") }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {phase.status === "pending_approval" ? (
          <Card style={styles.center}>
            <Ionicons name="checkmark-circle-outline" size={48} color={colors.success} />
            <Text style={styles.heading}>{t("join.pending.title")}</Text>
            <Text style={styles.body}>{t("join.pending.message")}</Text>
            {phase.churchName ? <Text style={styles.muted}>{t("join.pending.church", { churchName: phase.churchName })}</Text> : null}
            <Button title={t("join.done")} onPress={leave} />
          </Card>
        ) : (
          <View style={styles.stack}>
            <Text style={styles.body}>{t("join.intro")}</Text>
            <TextField
              label={t("join.codeLabel")}
              placeholder={t("join.codePlaceholder")}
              value={code}
              onChangeText={(text) => {
                setCode(normalizeJoinCode(text))
                if (phase.status === "error") setPhase({ status: "idle" })
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              autoComplete="off"
              maxLength={JOIN_CODE_MAX_LENGTH}
              returnKeyType="send"
              onSubmitEditing={() => void submit()}
              editable={!submitting}
              error={phase.status === "error" ? t(phase.messageKey) : undefined}
            />
            <Text style={styles.muted}>{t("join.codeHint")}</Text>
            <Button title={t("join.submit")} onPress={() => void submit()} loading={submitting} disabled={!canSubmit} />
          </View>
        )}
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, backgroundColor: colors.canvas, padding: spacing.xl },
  stack: { gap: spacing.md },
  center: { alignItems: "center", gap: spacing.md },
  heading: { ...type.h2, color: colors.ink, textAlign: "center" },
  body: { ...type.body, color: colors.ink, textAlign: "center" },
  muted: { ...type.supporting, color: colors.muted, textAlign: "center" },
})
