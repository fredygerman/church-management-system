import { Tabs } from "expo-router"
import { AiHeaderButton } from "../../components/ai/ai-header-button"
import { useT } from "../../lib/locale"

export default function MemberLayout() {
  const { t } = useT()
  return (
    <Tabs screenOptions={{ headerRight: () => <AiHeaderButton /> }}>
      <Tabs.Screen name="index" options={{ title: t("mobile.member.tabs.home") }} />
      <Tabs.Screen name="church" options={{ title: t("mobile.member.tabs.church") }} />
      <Tabs.Screen name="events" options={{ title: t("mobile.member.tabs.events") }} />
      <Tabs.Screen name="library" options={{ title: t("mobile.member.tabs.library") }} />
      <Tabs.Screen name="profile" options={{ title: t("mobile.member.tabs.profile") }} />
      <Tabs.Screen name="events/[id]" options={{ href: null, title: t("mobile.member.tabs.event") }} />
      <Tabs.Screen name="prayer" options={{ href: null, title: t("mobile.member.tabs.prayer") }} />
    </Tabs>
  )
}
