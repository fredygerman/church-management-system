import { Button, ScrollView, Text } from "react-native"
import { router } from "expo-router"
import { useT } from "../../lib/locale"
import { styles } from "../../components/screen-state"

// Hub for destinations that are not primary tabs: events, resources, inbox and prayer.
export default function MemberMoreScreen() {
  const { t } = useT()
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t("nav.more")}</Text>
      <Text style={styles.text}>{t("wiring.mobileMore.description")}</Text>
      <Button title={t("mobile.member.tabs.events")} onPress={() => router.push("/events")} />
      <Button title={t("wiring.nav.resources")} onPress={() => router.push("/library-catalog")} />
      <Button title={t("wiring.nav.inbox")} onPress={() => router.push("/inbox")} />
      <Button title={t("mobile.member.tabs.prayer")} onPress={() => router.push("/prayer")} />
    </ScrollView>
  )
}
