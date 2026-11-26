import { ScrollView, Text } from "react-native"
import { router } from "expo-router"
import { useT } from "../../../lib/locale"
import { Card, ListRow } from "../../../components/ui"
import { colors, spacing, type } from "../../../theme"

// Hub for destinations that are not primary tabs: events, resources, inbox and prayer.
// Every row points at a screen that exists; the header already names this page.
export default function MemberMoreScreen() {
  const { t } = useT()
  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, backgroundColor: colors.canvas }}>
      <Text style={{ ...type.supporting, color: colors.muted }}>{t("wiring.mobileMore.description")}</Text>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <ListRow icon="calendar-outline" title={t("mobile.member.tabs.events")} onPress={() => router.push("/events")} />
        <ListRow icon="book-outline" title={t("wiring.nav.resources")} onPress={() => router.push("/library-catalog")} />
        <ListRow icon="mail-outline" title={t("wiring.nav.inbox")} onPress={() => router.push("/inbox")} />
        <ListRow icon="heart-outline" title={t("mobile.member.tabs.prayer")} onPress={() => router.push("/prayer")} />
      </Card>
    </ScrollView>
  )
}
