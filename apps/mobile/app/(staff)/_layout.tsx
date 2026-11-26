import { Stack } from "expo-router"
import { AiHeaderButton } from "../../components/ai/ai-header-button"
import { useT } from "../../lib/locale"
import { useSession } from "../../lib/session"
import { colors, type } from "../../theme"

// A Stack, not Tabs: check-in is pushed on top of the (tabs) group with a Back button (see the member layout).
export default function StaffLayout() {
  const { contextKey } = useSession()
  const { t } = useT()
  return (
    // Keyed by context: a church or role change remounts every screen, so no screen keeps the previous branch's data.
    <Stack key={contextKey} screenOptions={{ headerRight: () => <AiHeaderButton />, headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.ink, headerTitleStyle: { ...type.h3 } }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="attendance" options={{ title: t("wiring.checkin.title") }} />
    </Stack>
  )
}
