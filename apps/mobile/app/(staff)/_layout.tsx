import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Tabs } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { AiHeaderButton } from "../../components/ai/ai-header-button"
import { roleHasTabPermission, type StaffTabPermission } from "../../lib/claims"
import { useT } from "../../lib/locale"
import { useSession } from "../../lib/session"
import { colors, spacing, type } from "../../theme"

export default function StaffLayout() {
  const insets = useSafeAreaInsets()
  const { user, contextKey } = useSession()
  const { t } = useT()
  // Hidden tabs (href null) stay reachable by URL; the API still rejects calls the role lacks.
  const tabHref = (permission: StaffTabPermission) =>
    roleHasTabPermission(user?.activeRole ?? undefined, permission) ? undefined : null

  return (
    // Keyed by context: a church or role change remounts every tab, so no screen keeps the previous branch's data.
    <Tabs key={contextKey} screenOptions={{ headerRight: () => <AiHeaderButton />, headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.ink, headerTitleStyle: { ...type.h3 }, tabBarActiveTintColor: colors.brand, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, paddingTop: spacing.xs, paddingBottom: insets.bottom + spacing.xs, height: 56 + insets.bottom }, tabBarLabelStyle: { fontSize: 12 } }}>
      <Tabs.Screen name="index" options={{ title: t("mobile.staff.tabs.dashboard"), href: tabHref("read:member"), tabBarIcon: ({ focused, color, size }) => <Ionicons name={focused ? "grid" : "grid-outline"} size={size} color={String(color)} /> }} />
      <Tabs.Screen name="people" options={{ title: t("mobile.staff.tabs.people"), href: tabHref("read:member"), tabBarIcon: ({ focused, color, size }) => <Ionicons name={focused ? "people" : "people-outline"} size={size} color={String(color)} /> }} />
      <Tabs.Screen name="services" options={{ title: t("mobile.staff.tabs.services"), href: tabHref("view:attendance"), tabBarIcon: ({ focused, color, size }) => <Ionicons name={focused ? "calendar" : "calendar-outline"} size={size} color={String(color)} /> }} />
      <Tabs.Screen name="content" options={{ title: t("mobile.staff.tabs.content"), href: tabHref("manage:files"), tabBarIcon: ({ focused, color, size }) => <Ionicons name={focused ? "documents" : "documents-outline"} size={size} color={String(color)} /> }} />
      <Tabs.Screen name="more" options={{ title: t("mobile.staff.tabs.more"), tabBarIcon: ({ focused, color, size }) => <Ionicons name={focused ? "ellipsis-horizontal-circle" : "ellipsis-horizontal-circle-outline"} size={size} color={String(color)} /> }} />
      {/* Reached from the services screen; hidden from the tab bar. */}
      <Tabs.Screen name="attendance" options={{ href: null, title: t("wiring.checkin.title") }} />
    </Tabs>
  )
}
