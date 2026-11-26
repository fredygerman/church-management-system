import { Tabs } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { AiHeaderButton } from "../../components/ai/ai-header-button"
import { useT } from "../../lib/locale"
import { useSession } from "../../lib/session"

export default function MemberLayout() {
  const { t } = useT()
  // Keyed by context: a church or role change remounts every tab, so no screen keeps the previous branch's data.
  const { contextKey } = useSession()
  return (
    <Tabs key={contextKey} screenOptions={{ headerRight: () => <AiHeaderButton /> }}>
      <Tabs.Screen name="index" options={{ title: t("mobile.member.tabs.home"), tabBarIcon: ({ focused, color, size }) => <Ionicons name={focused ? "home" : "home-outline"} size={size} color={String(color)} /> }} />
      <Tabs.Screen name="church" options={{ title: t("mobile.member.tabs.church"), tabBarIcon: ({ focused, color, size }) => <Ionicons name={focused ? "business" : "business-outline"} size={size} color={String(color)} /> }} />
      <Tabs.Screen name="library" options={{ title: t("mobile.member.tabs.library"), tabBarIcon: ({ focused, color, size }) => <Ionicons name={focused ? "library" : "library-outline"} size={size} color={String(color)} /> }} />
      <Tabs.Screen name="profile" options={{ title: t("mobile.member.tabs.profile"), tabBarIcon: ({ focused, color, size }) => <Ionicons name={focused ? "person" : "person-outline"} size={size} color={String(color)} /> }} />
      <Tabs.Screen name="more" options={{ title: t("nav.more"), tabBarIcon: ({ focused, color, size }) => <Ionicons name={focused ? "ellipsis-horizontal-circle" : "ellipsis-horizontal-circle-outline"} size={size} color={String(color)} /> }} />
      {/* Primary tabs are Home, Church, Library, Profile and More; the rest are reached from the More hub. */}
      <Tabs.Screen name="events" options={{ href: null, title: t("mobile.member.tabs.events") }} />
      <Tabs.Screen name="events/[id]" options={{ href: null, title: t("mobile.member.tabs.event") }} />
      <Tabs.Screen name="prayer" options={{ href: null, title: t("mobile.member.tabs.prayer") }} />
      {/* Reached from other screens; hidden from the tab bar. */}
      <Tabs.Screen name="library-catalog" options={{ href: null, title: t("mobile.member.tabs.library") }} />
      <Tabs.Screen name="library-detail" options={{ href: null, title: t("mobile.member.tabs.library") }} />
      <Tabs.Screen name="inbox" options={{ href: null, title: t("mobile.member.tabs.home") }} />
    </Tabs>
  )
}
