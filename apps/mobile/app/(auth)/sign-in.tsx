import { useState } from "react"
import { Button, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native"
import { ApiError, api } from "../../lib/api"
import { useSession } from "../../lib/session"

export default function SignInScreen() {
  const { signIn } = useSession()
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
      const apiError = caught instanceof ApiError ? caught : new ApiError("Unable to sign in. Try again.", "network")
      setError(apiError.kind === "not-configured" ? apiError.message : apiError.status === 401 ? "Invalid email or password." : apiError.kind === "network" ? apiError.message : apiError.message)
    } finally {
      setLoading(false)
    }
  }

  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
    <View style={styles.form}>
      <Text style={styles.title}>Mito Ya Baraka Church</Text>
      <Text style={styles.message}>Sign in to your church account.</Text>
      <TextInput accessibilityLabel="Email" autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={setEmail} placeholder="Email" style={styles.input} value={email} />
      <TextInput accessibilityLabel="Password" autoCapitalize="none" autoComplete="password" onChangeText={setPassword} placeholder="Password" secureTextEntry style={styles.input} value={password} />
      {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
      <Button disabled={loading || !email || !password} title={loading ? "Signing in…" : "Sign in"} onPress={submit} />
      {/* TODO: Have fluent reviewers provide Swahili copy before localization. */}
    </View>
  </KeyboardAvoidingView>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  form: { gap: 14, width: "100%" },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    fontSize: 18,
    marginBottom: 12,
  },
  input: { borderColor: "#9ca3af", borderRadius: 6, borderWidth: 1, fontSize: 16, padding: 12 },
  error: { color: "#a21c1c" },
})
