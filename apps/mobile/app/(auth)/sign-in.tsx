import { useState } from "react"
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native"
import { ApiError, api } from "../../lib/api"
import { useSession } from "../../lib/session"
import { useT } from "../../lib/locale"
import { Button, TextField } from "../../components/ui"
import { colors, spacing, type } from "../../theme"

export default function SignInScreen() {
  const { signIn } = useSession()
  const { t } = useT()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit() {
    setError("")
    setLoading(true)
    try {
      const response = await api.post<{ accessToken: string; refreshToken: string; user: Record<string, unknown> }>("/auth/login", { email, password })
      // The session gate sends the user to the member or staff area for their role.
      await signIn(response)
    } catch (caught) {
      const apiError = caught instanceof ApiError ? caught : null
      setError(!apiError ? t("mobile.member.signIn.genericError") : apiError.kind === "not-configured" ? apiError.message : apiError.status === 401 ? t("mobile.member.signIn.invalid") : apiError.kind === "network" ? t("mobile.member.signIn.networkError") : apiError.message)
    } finally {
      setLoading(false)
    }
  }

  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
    <View style={styles.form}>
      <Text style={styles.title}>Mito Ya Baraka Church</Text>
      <Text style={styles.message}>{t("mobile.member.signIn.subtitle")}</Text>
      <TextField label={t("mobile.member.signIn.email")} accessibilityLabel={t("mobile.member.signIn.email")} autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={setEmail} placeholder={t("mobile.member.signIn.email")} value={email} />
      <TextField label={t("mobile.member.signIn.password")} accessibilityLabel={t("mobile.member.signIn.password")} autoCapitalize="none" autoComplete="password" onChangeText={setPassword} placeholder={t("mobile.member.signIn.password")} secureTextEntry value={password} />
      {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
      <Button disabled={loading || !email || !password} loading={loading} title={loading ? t("mobile.member.signIn.submitting") : t("mobile.member.signIn.submit")} onPress={submit} />
    </View>
  </KeyboardAvoidingView>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  form: { gap: spacing.md, width: "100%", backgroundColor: colors.surface, padding: spacing.xl, borderRadius: 16 },
  title: {
    ...type.display,
    color: colors.brandStrong,
    textAlign: "center",
  },
  message: {
    ...type.body,
    color: colors.muted,
    marginBottom: 12,
  },
  error: { ...type.supporting, color: colors.danger },
})
