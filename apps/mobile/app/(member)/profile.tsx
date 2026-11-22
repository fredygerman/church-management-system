import { useCallback, useEffect, useState } from "react"
import { Button, ScrollView, Text, TextInput } from "react-native"
import { ApiError, api } from "../../lib/api"
import { useSession } from "../../lib/session"
import { ErrorState, LoadingState, styles } from "../../components/screen-state"

export default function ProfileScreen() {
  const { signOut } = useSession(); const [profile, setProfile] = useState<Record<string, unknown> | null>(null); const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [picture, setPicture] = useState(""); const [error, setError] = useState(""); const [saveError, setSaveError] = useState(""); const [confirmation, setConfirmation] = useState(""); const [loading, setLoading] = useState(true); const [editing, setEditing] = useState(false); const [saving, setSaving] = useState(false)
  const applyProfile = (value: Record<string, unknown>) => { setProfile(value); setName(typeof value.name === "string" ? value.name : ""); setEmail(typeof value.email === "string" ? value.email : ""); setPicture(typeof value.picture === "string" ? value.picture : "") }
  const load = useCallback(async () => { setLoading(true); try { applyProfile(await api.get<Record<string, unknown>>("/users/me")); setError("") } catch (caught) { setError(caught instanceof ApiError ? caught.message : "Unable to load your profile.") } finally { setLoading(false) } }, [])
  useEffect(() => { void load() }, [load])
  async function save() {
    setSaveError(""); setConfirmation("")
    if (!name.trim()) { setSaveError("Name is required."); return }
    if (!email.trim()) { setSaveError("Email is required."); return }
    setSaving(true)
    try { const result = await api.patch<{ user?: Record<string, unknown>; message?: string }>("/users/me", { name: name.trim(), email: email.trim(), picture: picture.trim() || undefined }); if (result.user) applyProfile(result.user); setEditing(false); setConfirmation(result.message || "Your profile was saved.") }
    catch (caught) { setSaveError(caught instanceof ApiError ? caught.message : "Unable to save your profile. Try again.") }
    finally { setSaving(false) }
  }
  if (loading) return <LoadingState />; if (error) return <ErrorState message={error} onRetry={() => void load()} />; if (!profile) return <ErrorState message="Profile is unavailable." onRetry={() => void load()} />
  return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><Text style={styles.title}>Profile</Text>{editing ? <><Text style={styles.formLabel}>Name</Text><TextInput accessibilityLabel="Name" editable={!saving} onChangeText={setName} style={styles.input} value={name} /><Text style={styles.formLabel}>Email</Text><TextInput accessibilityLabel="Email" autoCapitalize="none" autoComplete="email" editable={!saving} keyboardType="email-address" onChangeText={setEmail} style={styles.input} value={email} /><Text style={styles.formLabel}>Picture URL</Text><TextInput accessibilityLabel="Picture URL" autoCapitalize="none" editable={!saving} onChangeText={setPicture} style={styles.input} value={picture} />{saveError ? <Text accessibilityLiveRegion="polite" style={styles.error}>{saveError}</Text> : null}<Button disabled={saving} title={saving ? "Saving…" : "Save changes"} onPress={() => void save()} /><Button disabled={saving} title="Cancel" onPress={() => { applyProfile(profile); setEditing(false); setSaveError("") }} /></> : <><Text style={styles.heading}>{typeof profile.name === "string" ? profile.name : "Profile"}</Text>{typeof profile.email === "string" ? <Text style={styles.text}>{profile.email}</Text> : null}{typeof profile.role === "string" ? <Text style={styles.text}>{profile.role}</Text> : null}{confirmation ? <Text accessibilityLiveRegion="polite" style={styles.success}>{confirmation}</Text> : null}<Button title="Edit profile" onPress={() => { setConfirmation(""); setEditing(true) }} /><Button title="Sign out" onPress={() => void signOut()} /></>}{/* TODO: Have fluent reviewers provide Swahili copy before localization. */}</ScrollView>
}
