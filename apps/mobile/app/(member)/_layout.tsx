import { Stack } from "expo-router"
import { AiHeaderButton } from "../../components/ai/ai-header-button"
import { useT } from "../../lib/locale"
import { useSession } from "../../lib/session"
import { colors, type } from "../../theme"

// A Stack, not Tabs: screens pushed from Home, More or other screens sit on top of the (tabs) group with a Back button.
// Expo Router redirects a focused hidden Tabs route to the first visible tab, so hidden screens must not live in Tabs.
export default function MemberLayout() {
  const { t } = useT()
  // Keyed by context: a church or role change remounts every screen, so no screen keeps the previous branch's data.
  const { contextKey } = useSession()
  return (
    <Stack key={contextKey} screenOptions={{ headerRight: () => <AiHeaderButton />, headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.ink, headerTitleStyle: { ...type.h3 } }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="events" options={{ title: t("mobile.member.tabs.events") }} />
      <Stack.Screen name="events/[id]" options={{ title: t("mobile.member.tabs.event") }} />
      <Stack.Screen name="prayer" options={{ title: t("mobile.member.tabs.prayer") }} />
      <Stack.Screen name="inbox" options={{ title: t("wiring.nav.inbox") }} />
      <Stack.Screen name="library-catalog" options={{ title: t("wiring.nav.resources") }} />
      <Stack.Screen name="library-detail" options={{ title: t("mobile.member.tabs.library") }} />
    </Stack>
  )
}
