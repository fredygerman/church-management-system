import { ScrollView, Text, View } from "react-native"
import { router } from "expo-router"
import { useT } from "../../lib/locale"
import { styles } from "../../components/screen-state"
import { Card, ListRow } from "../../components/ui"
import { spacing } from "../../theme"

// Hub for destinations that are not primary tabs: events, resources, inbox and prayer.
export default function MemberMoreScreen() {
  const { t } = useT()
  return (
    <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg, gap: spacing.md }]}>
      <Text style={styles.title}>{t("nav.more")}</Text>
      <Text style={styles.text}>{t("wiring.mobileMore.description")}</Text>
      <Card><ListRow icon="calendar-outline" title={t("mobile.member.tabs.events")} onPress={() => router.push("/events")} /><ListRow icon="book-outline" title={t("wiring.nav.resources")} onPress={() => router.push("/library-catalog")} /><ListRow icon="mail-outline" title={t("wiring.nav.inbox")} onPress={() => router.push("/inbox")} /><ListRow icon="heart-outline" title={t("mobile.member.tabs.prayer")} onPress={() => router.push("/prayer")} /></Card>
    </ScrollView>
  )
}
