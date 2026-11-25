import { Button, ScrollView, Text } from "react-native"
import { dictionaries, type MessageKey, type Translate } from "@church/config"
import { LanguagePicker } from "../../components/language-picker"
import { SpacesSection } from "../../components/spaces-section"
import { styles } from "../../components/screen-state"
import { useT } from "../../lib/locale"
import { useSession } from "../../lib/session"

// Role values are stored as enum keys (zone_leader); show them as words.
function roleLabel(role: string, t: Translate) {
  const key = `mobile.shared.role.${role}`
  if (key in dictionaries.en) return t(key as MessageKey)
  const words = role.replace(/_/g, " ")
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export default function MoreScreen() {
  const { user, signOut } = useSession()
  const { t } = useT()

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t("mobile.staff.more.title")}</Text>
      <LanguagePicker />
      <Text style={styles.heading}>{typeof user?.name === "string" ? user.name : t("mobile.staff.more.signedIn")}</Text>
      {user?.activeRole ? <Text style={styles.text}>{roleLabel(user.activeRole, t)}</Text> : null}
      <SpacesSection />
      <Button title={t("common.signOut")} onPress={() => void signOut()} />
    </ScrollView>
  )
}
