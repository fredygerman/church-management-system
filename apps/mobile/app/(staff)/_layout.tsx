import { Tabs } from "expo-router"
import { AiHeaderButton } from "../../components/ai/ai-header-button"
import { roleHasTabPermission, type StaffTabPermission } from "../../lib/claims"
import { useT } from "../../lib/locale"
import { useSession } from "../../lib/session"

export default function StaffLayout() {
  const { user, contextKey } = useSession()
  const { t } = useT()
  // Hidden tabs (href null) stay reachable by URL; the API still rejects calls the role lacks.
  const tabHref = (permission: StaffTabPermission) =>
    roleHasTabPermission(user?.activeRole ?? undefined, permission) ? undefined : null

  return (
    // Keyed by context: a church or role change remounts every tab, so no screen keeps the previous branch's data.
    <Tabs key={contextKey} screenOptions={{ headerRight: () => <AiHeaderButton /> }}>
      <Tabs.Screen name="index" options={{ title: t("mobile.staff.tabs.dashboard"), href: tabHref("read:member") }} />
      <Tabs.Screen name="people" options={{ title: t("mobile.staff.tabs.people"), href: tabHref("read:member") }} />
      <Tabs.Screen name="services" options={{ title: t("mobile.staff.tabs.services"), href: tabHref("view:attendance") }} />
      <Tabs.Screen name="content" options={{ title: t("mobile.staff.tabs.content"), href: tabHref("manage:files") }} />
      <Tabs.Screen name="more" options={{ title: t("mobile.staff.tabs.more") }} />
    </Tabs>
  )
}
