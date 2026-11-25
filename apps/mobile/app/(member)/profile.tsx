import { useCallback, useEffect, useState } from "react"
import { Button, ScrollView, Text, TextInput } from "react-native"
import { ApiError, api } from "../../lib/api"
import { useSession } from "../../lib/session"
import { useT } from "../../lib/locale"
import { ErrorState, LoadingState, styles } from "../../components/screen-state"
import { LanguagePicker } from "../../components/language-picker"
import { SpacesSection } from "../../components/spaces-section"

export default function ProfileScreen() {
  const { signOut } = useSession(); const { t } = useT(); const [profile, setProfile] = useState<Record<string, unknown> | null>(null); const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [picture, setPicture] = useState(""); const [error, setError] = useState(""); const [saveError, setSaveError] = useState(""); const [confirmation, setConfirmation] = useState(""); const [loading, setLoading] = useState(true); const [editing, setEditing] = useState(false); const [saving, setSaving] = useState(false)
  const applyProfile = (value: Record<string, unknown>) => { setProfile(value); setName(typeof value.name === "string" ? value.name : ""); setEmail(typeof value.email === "string" ? value.email : ""); setPicture(typeof value.picture === "string" ? value.picture : "") }
  const load = useCallback(async () => { setLoading(true); try { applyProfile(await api.get<Record<string, unknown>>("/users/me")); setError("") } catch (caught) { setError(caught instanceof ApiError ? caught.message : t("mobile.member.profile.loadError")) } finally { setLoading(false) } }, [t])
  useEffect(() => { void load() }, [load])
  async function save() {
    setSaveError(""); setConfirmation("")
    if (!name.trim()) { setSaveError(t("mobile.member.profile.nameRequired")); return }
    if (!email.trim()) { setSaveError(t("mobile.member.profile.emailRequired")); return }
    setSaving(true)
    try { const result = await api.patch<{ user?: Record<string, unknown>; message?: string }>("/users/me", { name: name.trim(), email: email.trim(), picture: picture.trim() || undefined }); if (result.user) applyProfile(result.user); setEditing(false); setConfirmation(result.message || t("mobile.member.profile.saved")) }
    catch (caught) { setSaveError(caught instanceof ApiError ? caught.message : t("mobile.member.profile.saveError")) }
    finally { setSaving(false) }
  }
  if (loading) return <LoadingState />; if (error) return <ErrorState message={error} onRetry={() => void load()} />; if (!profile) return <ErrorState message={t("mobile.member.profile.unavailable")} onRetry={() => void load()} />
  return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><Text style={styles.title}>{t("mobile.member.profile.title")}</Text><LanguagePicker />{editing ? <><Text style={styles.formLabel}>{t("mobile.member.profile.name")}</Text><TextInput accessibilityLabel={t("mobile.member.profile.name")} editable={!saving} onChangeText={setName} style={styles.input} value={name} /><Text style={styles.formLabel}>{t("mobile.member.profile.email")}</Text><TextInput accessibilityLabel={t("mobile.member.profile.email")} autoCapitalize="none" autoComplete="email" editable={!saving} keyboardType="email-address" onChangeText={setEmail} style={styles.input} value={email} /><Text style={styles.formLabel}>{t("mobile.member.profile.pictureUrl")}</Text><TextInput accessibilityLabel={t("mobile.member.profile.pictureUrl")} autoCapitalize="none" editable={!saving} onChangeText={setPicture} style={styles.input} value={picture} />{saveError ? <Text accessibilityLiveRegion="polite" style={styles.error}>{saveError}</Text> : null}<Button disabled={saving} title={saving ? t("common.saving") : t("mobile.member.profile.saveChanges")} onPress={() => void save()} /><Button disabled={saving} title={t("common.cancel")} onPress={() => { applyProfile(profile); setEditing(false); setSaveError("") }} /></> : <><Text style={styles.heading}>{typeof profile.name === "string" ? profile.name : t("mobile.member.profile.title")}</Text>{typeof profile.email === "string" ? <Text style={styles.text}>{profile.email}</Text> : null}{typeof profile.role === "string" ? <Text style={styles.text}>{profile.role}</Text> : null}{confirmation ? <Text accessibilityLiveRegion="polite" style={styles.success}>{confirmation}</Text> : null}<Button title={t("mobile.member.profile.edit")} onPress={() => { setConfirmation(""); setEditing(true) }} /><SpacesSection /><Button title={t("common.signOut")} onPress={() => void signOut()} /></>}</ScrollView>
}
