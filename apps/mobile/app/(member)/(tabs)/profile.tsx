import { useCallback, useEffect, useState } from "react"
import { Pressable, ScrollView, Text, View } from "react-native"
import { ApiError, api } from "../../../lib/api"
import { useSession } from "../../../lib/session"
import { useT } from "../../../lib/locale"
import { ErrorState, LoadingState, styles } from "../../../components/screen-state"
import { LanguagePicker } from "../../../components/language-picker"
import { SpacesSection } from "../../../components/spaces-section"
import { Button, Card, ListRow, TextField } from "../../../components/ui"
import { colors, radii, spacing, type } from "../../../theme"

// The header already names the screen, so there is no page title here.
export default function ProfileScreen() {
  const { signOut, isStaff, setSpace, user } = useSession()
  const { t } = useT()
  const churchId = typeof user?.churchId === "string" ? user.churchId : null
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [churchName, setChurchName] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [picture, setPicture] = useState("")
  const [error, setError] = useState("")
  const [saveError, setSaveError] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const applyProfile = (value: Record<string, unknown>) => {
    setProfile(value)
    setName(typeof value.name === "string" ? value.name : "")
    setEmail(typeof value.email === "string" ? value.email : "")
    setPicture(typeof value.picture === "string" ? value.picture : "")
  }
  const load = useCallback(async () => {
    setLoading(true)
    try {
      applyProfile(await api.get<Record<string, unknown>>("/users/me"))
      setError("")
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t("mobile.member.profile.loadError"))
    } finally {
      setLoading(false)
    }
  }, [t])
  useEffect(() => { void load() }, [load])

  // The church name is decorative in the header; if it cannot load, the header simply omits it.
  useEffect(() => {
    let active = true
    setChurchName("")
    if (!churchId) return () => { active = false }
    api.get<Record<string, unknown>>(`/churches/${churchId}`).then(
      (church) => { if (active && typeof church.name === "string") setChurchName(church.name) },
      () => { if (active) setChurchName("") },
    )
    return () => { active = false }
  }, [churchId])

  async function save() {
    setSaveError("")
    setConfirmation("")
    if (!name.trim()) { setSaveError(t("mobile.member.profile.nameRequired")); return }
    if (!email.trim()) { setSaveError(t("mobile.member.profile.emailRequired")); return }
    setSaving(true)
    try {
      const result = await api.patch<{ user?: Record<string, unknown>; message?: string }>("/users/me", { name: name.trim(), email: email.trim(), picture: picture.trim() || undefined })
      if (result.user) applyProfile(result.user)
      setEditing(false)
      setConfirmation(result.message || t("mobile.member.profile.saved"))
    } catch (caught) {
      setSaveError(caught instanceof ApiError ? caught.message : t("mobile.member.profile.saveError"))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />
  if (!profile) return <ErrorState message={t("mobile.member.profile.unavailable")} onRetry={() => void load()} />

  const displayName = typeof profile.name === "string" && profile.name.trim() ? profile.name.trim() : t("mobile.member.profile.title")
  const initials = displayName.split(/\s+/).map((part) => part[0] ?? "").slice(0, 2).join("").toUpperCase()
  const emailText = typeof profile.email === "string" ? profile.email : undefined

  return <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.huge, backgroundColor: colors.canvas }} keyboardShouldPersistTaps="handled">
    <Card style={{ backgroundColor: colors.brandStrong, borderColor: colors.brandStrong, alignItems: "center", paddingVertical: spacing.xl, gap: spacing.xs }}>
      <View accessible={false} style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: colors.tint, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm }}>
        <Text style={{ ...type.h2, color: colors.brandStrong }}>{initials}</Text>
      </View>
      <Text accessibilityRole="header" style={{ ...type.h2, color: "#FFFFFF", textAlign: "center" }}>{displayName}</Text>
      <Text style={{ ...type.supporting, color: "#E0E7FF", textAlign: "center" }}>
        {[t("mobile.member.profile.memberRole"), churchName].filter(Boolean).join(" · ")}
      </Text>
    </Card>

    {confirmation ? <Text accessibilityLiveRegion="polite" style={styles.success}>{confirmation}</Text> : null}

    {editing ? <Card style={{ gap: spacing.md }}>
      <TextField autoCapitalize="words" editable={!saving} label={t("mobile.member.profile.name")} onChangeText={setName} value={name} />
      <TextField autoCapitalize="none" autoComplete="email" editable={!saving} keyboardType="email-address" label={t("mobile.member.profile.email")} onChangeText={setEmail} value={email} />
      <TextField autoCapitalize="none" editable={!saving} label={t("mobile.member.profile.pictureUrl")} onChangeText={setPicture} value={picture} />
      {saveError ? <Text accessibilityLiveRegion="polite" style={styles.error}>{saveError}</Text> : null}
      <Button disabled={saving} loading={saving} title={saving ? t("common.saving") : t("mobile.member.profile.saveChanges")} onPress={() => void save()} />
      <Button disabled={saving} variant="secondary" title={t("common.cancel")} onPress={() => { applyProfile(profile); setEditing(false); setSaveError("") }} />
    </Card> : <Card style={{ padding: 0, overflow: "hidden" }}>
      <View style={{ padding: spacing.md }}>
        <ListRow
          icon="person-outline"
          title={t("mobile.member.profile.myDetails")}
          subtitle={emailText}
          onPress={() => { setConfirmation(""); setEditing(true) }}
        />
      </View>
    </Card>}

    <Card>
      <LanguagePicker />
    </Card>

    {isStaff ? <Card style={{ backgroundColor: colors.tint, borderColor: colors.tint, gap: spacing.md }}>
      <Text style={{ ...type.body, color: colors.ink, fontWeight: "600" }}>{t("wiring.spaces.toStaff")}</Text>
      <Text style={{ ...type.supporting, color: colors.muted }}>{t("mobile.member.profile.staffHint")}</Text>
      <Button variant="primary" icon="swap-horizontal-outline" title={t("wiring.spaces.toStaff")} onPress={() => setSpace("staff")} />
    </Card> : null}

    <SpacesSection />

    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("common.signOut")}
      onPress={() => void signOut()}
      style={({ pressed }) => [{ minHeight: 48, borderRadius: radii.card, alignItems: "center", justifyContent: "center", marginTop: spacing.lg }, pressed && { opacity: 0.7 }]}
    >
      <Text style={{ ...type.body, color: colors.danger, fontWeight: "600" }}>{t("common.signOut")}</Text>
    </Pressable>
  </ScrollView>
}
